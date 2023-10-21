import time
import cv2
import numpy as np
from typing import List, Tuple, Optional

class EyeDetector:

    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

    def filter_eyes(self, eyes: List[Tuple[int]], face_y: int, face_height: int) -> List[Tuple[int]]:
        valid_eyes = []
        for (x, y, w, h) in eyes:
            y_global = y + face_y
            if y_global < face_y + face_height * 0.5:
                valid_eyes.append((x, y, w, h))
        if len(valid_eyes) != 2:
            return []
        eye_1, eye_2 = valid_eyes
        return [] if abs(eye_1[1] - eye_2[1]) > eye_1[3] * 0.2 else valid_eyes

    def get_pupil_direction(self, eye_center: Tuple[int], pupil_position: Tuple[int]) -> str:
        x_distance = pupil_position[0] - eye_center[0]
        y_distance = pupil_position[1] - eye_center[1]

        direction = ""

        if y_distance < -eye_center[1] * 0.2:
            direction += "Up"
        elif y_distance > eye_center[1] * 0.2:
            direction += "Down"

        if x_distance < -eye_center[0] * 0.2:
            direction += " Left"
        elif x_distance > eye_center[0] * 0.2:
            direction += " Right"

        return direction or "Center"

    def detect_pupil(self, roi_gray: np.ndarray) -> Optional[Tuple[int, int]]:
        scale_factor = 4
        upscaled = cv2.resize(roi_gray, (0, 0), fx=scale_factor, fy=scale_factor)

        _, thresholded = cv2.threshold(upscaled, 60, 255, cv2.THRESH_BINARY_INV)

        kernel = np.ones((2, 2), np.uint8)
        thresholded = cv2.dilate(thresholded, kernel, iterations=1)

        M = cv2.moments(thresholded)
        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])

            cx //= scale_factor
            cy //= scale_factor

            return (cx, cy)

        return None

    def detect_eye(self, gray_img: np.ndarray, color_img: np.ndarray) -> np.ndarray:
        faces = self.face_cascade.detectMultiScale(gray_img, scaleFactor=1.3, minNeighbors=5)

        for (x, y, w, h) in faces:
            roi_gray = gray_img[y:y+h, x:x+w]
            eyes = self.eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.2, minNeighbors=5)
            
            eyes = self.filter_eyes(eyes, y, h)

            for (ex, ey, ew, eh) in eyes:
                cv2.rectangle(color_img, (x+ex, y+ey), (x+ex+ew, y+ey+eh), (255, 255, 255), 10)

                adjusted_ey = int(ey + 0.1 * eh)
                adjusted_eh = int(0.75 * eh)

                eye_center = (ew / 2, adjusted_eh / 2)

                eye_roi = roi_gray[int(ey + 0.25 * eh):ey+eh, ex:ex+ew]
                pupil_point = self.detect_pupil(eye_roi)

                original_center = (x + ex + ew // 2, y + ey + eh // 2)
                cv2.circle(color_img, original_center, 3, (0, 0, 255), -1)

                if pupil_point is not None:
                    pupil_y_adjusted = y + int(ey + 0.325 * eh) + pupil_point[1]
                    cv2.circle(color_img, (x+ex+pupil_point[0], pupil_y_adjusted), 3, (0, 255, 0), -1)

                    global_pupil_position = (pupil_point[0], adjusted_ey + pupil_point[1] - ey)
                    direction = self.get_pupil_direction(original_center, global_pupil_position)
                
        return color_img
    
    def process_frame(self, frame: np.ndarray) -> np.ndarray:
        scale_percent = 100
        width = int(frame.shape[1] * scale_percent / 100)
        height = int(frame.shape[0] * scale_percent / 100)
        dim = (width, height)
        frame_resized = cv2.resize(frame, dim, interpolation=cv2.INTER_AREA)

        gray_resized = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2GRAY)
        frame_resized = self.detect_eye(gray_resized, frame_resized)

        frame = cv2.resize(frame_resized, (frame.shape[1], frame.shape[0]), interpolation=cv2.INTER_AREA)
        return frame

    def start(self):
        cap = cv2.VideoCapture(0)
        total_time = 0
        total_frames = 0
        while True:
            _, frame = cap.read()

            start_time = time.time()
            frame = self.process_frame(frame)
            end_time = time.time()
            total_frames += 1
            total_time += end_time - start_time
            # print(f"Average time per frame: {total_time / total_frames}")


            cv2.imshow('Eye Detection', frame)
            code = cv2.waitKey(10)
            if code == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()
        avg_time = total_time / total_frames
        print(f"Average time per frame: {avg_time}")

if __name__ == "__main__":
    detector = EyeDetector()
    detector.start()
