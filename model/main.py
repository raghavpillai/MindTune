import time
import subprocess
import shutil
from typing import Annotated
from fastapi import FastAPI, File, UploadFile, Response
from jitteriness import compute_jitteriness_from_linear_movement, apply_smoothing
from fastapi.responses import FileResponse
from typing import List, Optional
import modal

mounts = [
    modal.Mount.from_local_file(
        "checkpoint.pt",
        "/checkpoint.pt",
    ),
    modal.Mount.from_local_file(
        "checkpoint.pt",
        "/root/checkpoint.pt",
    ),
]

image = (
    modal.Image.debian_slim(python_version="3.10")
    .run_commands(
        "python3 --version",
        "apt-get update",
        "apt-get install -y git",
        "apt-get install -y wget build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev",
        "apt-get update && apt-get install ffmpeg libsm6 libxext6  -y",
        "pip3 install --upgrade setuptools wheel cmake",
    )
    .pip_install_from_requirements("requirements.txt")
    .run_commands(
        # install packages
        # get sample video
        "wget https://github.com/devanshusingla/penalty-shot-project/raw/main/saved_renders/greedy_vs_ddpg.mp4",
        # goes to /greedy....mp4
        # git clone repo
        "git clone https://github.com/david-wb/gaze-estimation.git",
        "mv gaze-estimation gazeml",
        # get miniconda

        # "wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh",
        # "bash Miniconda3-latest-Linux-x86_64.sh -b",
        # "export PATH=/root/miniconda3/bin:$PATH",
        # "wget https://shreyjoshi.com/env-linux.yml",
        # # create conda env
        # "/root/miniconda3/bin/conda env create -f env-linux.yml -vvv",
        # "echo Finished installing dependencies."
        # "/root/miniconda3/bin/conda activate ge-linux",
        # "echo Finished activating conda environment. installing opencv...",
        # # install opencv
        # "/root/miniconda3/bin/conda install opencv -c conda-forge",
        # "echo Finished installing opencv. Fetching models...",
        # Download face landmark predictor model

        "wget http://dlib.net/files/shape_predictor_5_face_landmarks.dat.bz2",
        "echo unzipping...",
        "bzip2 -d shape_predictor_5_face_landmarks.dat.bz2",
        # done, just log some stuff
        "echo LS-ing /",
        "ls -l /",
        "echo LS-ing /root",
        "ls -l /root",
        "echo LS-ing /gazeml",
        "ls -l /gazeml",
    )
)

stub = modal.Stub(name="mind-tune", mounts=mounts, image=image)
stub.gaze_coords = modal.Dict.new()
stub.user_video_data = modal.Dict.new()


@stub.function()
@modal.web_endpoint(method="GET")
def heartbeat():
    return {"status": "ok"}

@stub.function()
@modal.web_endpoint(method="GET")
def dir_gaze_data(user_id: str):
    print("gaze data requested, user_id: ", user_id)
    if user_id in stub.gaze_coords:
        return str(stub.gaze_coords[user_id])
    else:
        return "no gaze data found for user id"


@stub.function()
@modal.web_endpoint(method="GET")
def dir_gaze_video(user_id: str):
    print("video data requested, user_id: ", user_id)
    if user_id in stub.user_video_data:
        raw_bytes = stub.user_video_data[user_id]
        with open("output.mp4", "wb") as f:
            f.write(raw_bytes)
        return FileResponse(path="output.mp4", filename="gaze_video.mp4", media_type="video/mp4")
    else:
        return "no video data found for user id"

@stub.function()
@modal.web_endpoint(method="GET")
def clear_gaze_data():
    stub.gaze_coords = modal.Dict.new()
    return "cleared gaze data"


@stub.function()
@modal.web_endpoint(method="GET")
def clear_video_data():
    stub.user_video_data = modal.Dict.new()
    return "cleared video data"


@stub.function(cpu=16, memory=8096, gpu="T4", container_idle_timeout=60)
@modal.web_endpoint(method="POST")
def get_eyetracking_results(videofile: UploadFile = File(...), user_id: str = "john_doe"):
    print("receieved filename ", videofile.filename)
    import torch
    from torch.nn import DataParallel

    
    import os
    import numpy as np
    import cv2
    import dlib
    import imutils

    import sys
 
    # setting path
    sys.path.append('/gazeml')
    
    import sys
    sys.path.insert(0, '..')

    print(sys.path)

    import gazeml.util.gaze
    from imutils import face_utils

    from gazeml.models.eyenet import EyeNet
    from gazeml.util.eye_prediction import EyePrediction
    from gazeml.util.eye_sample import EyeSample

    # "load models"
    dirname = os.path.dirname(__file__)
    face_cascade = cv2.CascadeClassifier(
        "/gazeml/lbpcascade_frontalface_improved.xml"
    )
    landmarks_detector = dlib.shape_predictor(
        "/shape_predictor_5_face_landmarks.dat"
    )

    # "load eyenet"
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(device)

    checkpoint = torch.load("checkpoint.pt", map_location=device)
    nstack = checkpoint["nstack"]
    nfeatures = checkpoint["nfeatures"]
    nlandmarks = checkpoint["nlandmarks"]
    eyenet = EyeNet(nstack=nstack, nfeatures=nfeatures, nlandmarks=nlandmarks).to(device)
    eyenet.load_state_dict(checkpoint["model_state_dict"])

    # define functions

    def detect_landmarks(face, frame, scale_x=0, scale_y=0):
        (x, y, w, h) = (int(e) for e in face)
        rectangle = dlib.rectangle(x, y, x + w, y + h)
        face_landmarks = landmarks_detector(frame, rectangle)
        return face_utils.shape_to_np(face_landmarks)


    def draw_cascade_face(face, frame):
        (x, y, w, h) = (int(e) for e in face)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)


    def draw_landmarks(landmarks, frame):
        for (x, y) in landmarks:
            cv2.circle(frame, (int(x), int(y)), 2, (0, 255, 0), -1, lineType=cv2.LINE_AA)


    def segment_eyes(frame, landmarks, ow=160, oh=96):
        eyes = []

        # Segment eyes
        for corner1, corner2, is_left in [(2, 3, True), (0, 1, False)]:
            x1, y1 = landmarks[corner1, :]
            x2, y2 = landmarks[corner2, :]
            eye_width = 1.5 * np.linalg.norm(landmarks[corner1, :] - landmarks[corner2, :])
            if eye_width == 0.0:
                return eyes

            cx, cy = 0.5 * (x1 + x2), 0.5 * (y1 + y2)

            # center image on middle of eye
            translate_mat = np.asmatrix(np.eye(3))
            translate_mat[:2, 2] = [[-cx], [-cy]]
            inv_translate_mat = np.asmatrix(np.eye(3))
            inv_translate_mat[:2, 2] = -translate_mat[:2, 2]

            # Scale
            scale = ow / eye_width
            scale_mat = np.asmatrix(np.eye(3))
            scale_mat[0, 0] = scale_mat[1, 1] = scale
            inv_scale = 1.0 / scale
            inv_scale_mat = np.asmatrix(np.eye(3))
            inv_scale_mat[0, 0] = inv_scale_mat[1, 1] = inv_scale

            estimated_radius = 0.5 * eye_width * scale

            # center image
            center_mat = np.asmatrix(np.eye(3))
            center_mat[:2, 2] = [[0.5 * ow], [0.5 * oh]]
            inv_center_mat = np.asmatrix(np.eye(3))
            inv_center_mat[:2, 2] = -center_mat[:2, 2]

            # Get rotated and scaled, and segmented image
            transform_mat = center_mat * scale_mat * translate_mat
            inv_transform_mat = inv_translate_mat * inv_scale_mat * inv_center_mat

            eye_image = cv2.warpAffine(frame, transform_mat[:2, :], (ow, oh))
            eye_image = cv2.equalizeHist(eye_image)

            if is_left:
                eye_image = np.fliplr(eye_image)
                # cv2.imshow("left eye image", eye_image)
            else:
                # cv2.imshow("right eye image", eye_image)
                pass
            eyes.append(
                EyeSample(
                    orig_img=frame.copy(),
                    img=eye_image,
                    transform_inv=inv_transform_mat,
                    is_left=is_left,
                    estimated_radius=estimated_radius,
                )
            )
        return eyes

    def smooth_eye_landmarks(
        eye: EyePrediction,
        prev_eye: Optional[EyePrediction],
        smoothing=0.2,
        gaze_smoothing=0.4,
    ):
        if prev_eye is None:
            return eye
        return EyePrediction(
            eye_sample=eye.eye_sample,
            landmarks=smoothing * prev_eye.landmarks + (1 - smoothing) * eye.landmarks,
            gaze=gaze_smoothing * prev_eye.gaze + (1 - gaze_smoothing) * eye.gaze,
        )


    def run_eyenet(eyes: List[EyeSample], ow=160, oh=96) -> List[EyePrediction]:
        result = []
        for eye in eyes:
            with torch.no_grad():
                x = torch.tensor([eye.img], dtype=torch.float32).to(device)
                _, landmarks, gaze = eyenet.forward(x)
                landmarks = np.asarray(landmarks.cpu().numpy()[0])
                gaze = np.asarray(gaze.cpu().numpy()[0])
                assert gaze.shape == (2,)
                assert landmarks.shape == (34, 2)

                landmarks = landmarks * np.array([oh / 48, ow / 80])

                temp = np.zeros((34, 3))
                if eye.is_left:
                    temp[:, 0] = ow - landmarks[:, 1]
                else:
                    temp[:, 0] = landmarks[:, 1]
                temp[:, 1] = landmarks[:, 0]
                temp[:, 2] = 1.0
                landmarks = temp
                assert landmarks.shape == (34, 3)
                landmarks = np.asarray(np.matmul(landmarks, eye.transform_inv.T))[:, :2]
                assert landmarks.shape == (34, 2)
                result.append(EyePrediction(eye_sample=eye, landmarks=landmarks, gaze=gaze))
        return result
    
    def process_frame(
        frame_bgr,
        current_face=None,
        landmarks=None,
        left_eye=None,
        right_eye=None,
    ):
        orig_frame = frame_bgr.copy()
        frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray)
        gaze_coords = []


        if len(faces):
            next_face = faces[0]
            if current_face is not None:
                current_face = 0.95 * next_face + (1 - 0.95) * current_face
            else:
                current_face = next_face

        if current_face is not None:
            # draw_cascade_face(current_face, orig_frame)
            next_landmarks = detect_landmarks(current_face, gray)

            if landmarks is not None:
                landmarks = next_landmarks * 0.95 + (1 - 0.95) * landmarks
            else:
                landmarks = next_landmarks

            # draw_landmarks(landmarks, orig_frame)

        if landmarks is not None:
            eye_samples = segment_eyes(gray, landmarks)

            eye_preds = run_eyenet(eye_samples)
            left_eyes = list(filter(lambda x: x.eye_sample.is_left, eye_preds))
            right_eyes = list(filter(lambda x: not x.eye_sample.is_left, eye_preds))

            if left_eyes:
                left_eye = smooth_eye_landmarks(left_eyes[0], left_eye, smoothing=0.1)
            if right_eyes:
                right_eye = smooth_eye_landmarks(right_eyes[0], right_eye, smoothing=0.1)
            
            # left eye, right eye

            for ep in [left_eye, right_eye]:
                for (x, y) in ep.landmarks[16:33]:
                    color = (0, 255, 0)
                    if ep.eye_sample.is_left:
                        color = (0, 255, 0)
                    cv2.circle(
                        orig_frame,
                        (int(round(x)), int(round(y))),
                        1,
                        color,
                        -1,
                        lineType=cv2.LINE_AA,
                    )

                gaze = ep.gaze.copy()
                if ep.eye_sample.is_left:
                    gaze[1] = -gaze[1]
                gazeml.util.gaze.draw_gaze(
                    orig_frame, ep.landmarks[-2], gaze, length=60.0, thickness=2
                )

                # compute end of gaze vector and add coords to gaze_coords for each eye
                image_out = orig_frame
                if len(image_out.shape) == 2 or image_out.shape[2] == 1:
                    image_out = cv.cvtColor(image_out, cv.COLOR_GRAY2BGR)
                dx = -60 * np.sin(gaze[1])
                dy = 60 * np.sin(gaze[0])
                coords = tuple(np.round([ep.landmarks[-2][0] + dx, ep.landmarks[-2][1] + dy]).astype(int))
                print("coords, ", coords)
                gaze_coords.append(coords)
        
        print('returning gaze coorsd, ', gaze_coords)
        return orig_frame, current_face, landmarks, left_eye, right_eye, gaze_coords

    # save video file to disk
    video_path = "/greedy_vs_ddpg.mov"
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(videofile.file, buffer)
    print("saved video file")

    # reincoding (ffmpeg -i /greedy_vs_ddpg.mov -c:v copy -c:a copy /output_fixed.mov)
    # print('reincoding')
    # subprocess.run("ffmpeg -i /greedy_vs_ddpg.mov -c:v copy -c:a copy /greedy_vs_ddpg.mov", shell=True)


    # gpu setup stuff
    torch.backends.cudnn.enabled = True

    video = cv2.VideoCapture(video_path)
    print("number of frames: ", video.get(cv2.CAP_PROP_FRAME_COUNT))
    print("video resolution: ", video.get(cv2.CAP_PROP_FRAME_WIDTH), video.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # run model on video file frames and return 1) video file with gaze tracking and 2) gaze tracking data
    current_face = None
    landmarks = None
    left_eye = None
    right_eye = None
    gaze_coords = None
    width = video.get(cv2.CAP_PROP_FRAME_WIDTH )
    height = video.get(cv2.CAP_PROP_FRAME_HEIGHT )
    fps =  video.get(cv2.CAP_PROP_FPS)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')

    out = cv2.VideoWriter('output.mp4', fourcc, fps, (int(width), int(height)))
    gaze_data_dict_temp = []
    
    while video.isOpened():
        print("processing frame number: ", video.get(cv2.CAP_PROP_POS_FRAMES), " / ", video.get(cv2.CAP_PROP_FRAME_COUNT)) 

        if video.get(cv2.CAP_PROP_POS_FRAMES)+1 == video.get(cv2.CAP_PROP_FRAME_COUNT):
            break

        _, frame_bgr = video.read()
        annotated_frame, current_face, landmarks, left_eye, right_eye, gaze_coords = process_frame(frame_bgr, current_face, landmarks, left_eye, right_eye)
        
        out.write(annotated_frame)
        gaze_data_dict_temp.append(gaze_coords)

        print("processed to annotated_frame ", annotated_frame.shape)
    
    out.release()
    video.release()
    temp_user_dict = {}
    if user_id in stub.gaze_coords:
        temp_user_dict = stub.gaze_coords[user_id]
    
    # gaze data dict temp is [((lx, ly), (rx, ry)), ((lx, ly), (rx, ry)), ...))]
    gaze_data_dict_temp = [i for i in gaze_data_dict_temp if i != []]
    temp_user_dict = {"gaze_data": gaze_data_dict_temp}

    print("GAZE DATA DICT_TEMP UPDATE, ", gaze_data_dict_temp)

    # send gaze tracking data somewhere to be processed for jitteriness
    left_eye_coords = np.array([i[0] for i in gaze_data_dict_temp])
    right_eye_coords = np.array([i[1] for i in gaze_data_dict_temp])
        

    print("eye coords: ", left_eye_coords.shape)

    jitteriness_score = np.array(compute_jitteriness_from_linear_movement(left_eye_coords, 60)) + np.array(compute_jitteriness_from_linear_movement(right_eye_coords, 60))/2
    temp_user_dict["jitteriness_score"] = jitteriness_score.tolist()
    temp_user_dict["smoothed_jitteriness_score"] = apply_smoothing(jitteriness_score, 10).tolist()

    # update final stub dict with all data
    stub.gaze_coords[user_id] = temp_user_dict

    # now convert video to bytes and add to stub dict
    print("writing video bytes to dict")
    with open("output.mp4", "rb") as f:
        video_bytes = f.read()
        print('read video bytes', video_bytes[:10])
        stub.user_video_data[user_id] = video_bytes
        print('sent updated dict')

    # return mp4 file with gaze tracking annotations
    return FileResponse(path="output.mp4", filename="output.mp4", media_type="video/mp4")
    # return gaze_tracking_data