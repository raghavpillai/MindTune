import cv2
import numpy as np

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def filter_eyes(eyes, face_y, face_height):
    valid_eyes = []
    for (x, y, w, h) in eyes:
        y_global = y + face_y
        if y_global < face_y + face_height * 0.5:
            valid_eyes.append((x, y, w, h))
    if len(valid_eyes) != 2:
        return []
    eye_1, eye_2 = valid_eyes
    if abs(eye_1[1] - eye_2[1]) > eye_1[3] * 0.2:  # horizontal alignment
        return []
    return valid_eyes

def detect_pupil(roi_gray):
    # Invert the ROI and threshold to isolate the darkest regions (pupils).
    _, thresholded = cv2.threshold(roi_gray, 60, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        M = cv2.moments(largest_contour)
        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            return (cx, cy)
    return None

def detect_eye(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
    
    for (x, y, w, h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.2, minNeighbors=5)
        
        eyes = filter_eyes(eyes, y, h)

        for (ex, ey, ew, eh) in eyes:
            cv2.rectangle(img, (x+ex, y+ey), (x+ex+ew, y+ey+eh), (255, 255, 255), 10)
            
            # Adjusting the ROI to exclude the top 25% of the detected eye region to avoid eyebrows
            eye_roi = roi_gray[int(ey + 0.25 * eh):ey+eh, ex:ex+ew]
            pupil_point = detect_pupil(eye_roi)
            
            if pupil_point is not None:
                cv2.circle(img, (x+ex+pupil_point[0], int(y+ey+0.25*eh)+pupil_point[1]), 3, (0, 255, 0), -1)
                
    return img

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    frame = detect_eye(frame)
    cv2.imshow('Eye Detection', frame)
    code = cv2.waitKey(10)
    if code == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
