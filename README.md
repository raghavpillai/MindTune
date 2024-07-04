Devpost Link: https://devpost.com/software/mindtune
## Inspiration
Alzheimer's is a very interesting, scary disease. There's no decided cause for the neuro-degenerative disease among scientists, and neither is there any cure. And on a personal level, we've all met people before who have had family members either currently or previously suffering from Alzheimer's. Inspired by this and the health challenges posted at this hackathon, we decided to come up with a tool to help with Alzheimer's diagnosis and recovery efforts.

## What it does
MindTune is a tool to detect early signs of Alzheimer's and other neuro-degenerative diseases in patients. At-risk patients download the app on their phone and participate in an in-app session on a weekly or daily basis. This session has 2 main features: a comprehensive Neuro-Cognition testing system and an accurate Eye-Tracking system. Doctors can then view this data in a separate website and analyze their patients for any early signs of diseases. Our Neuro-Cognition system works by prompting users questions about their life/day and then using NLP to analyze their responses for any warning signs of reduced cognitive ability. Our Eye-Tracking system uses a highly-accurate gaze-estimation model to check "jiteriness" in users' pupils as another warning sign of Alzheimer's.

## How we built it
MindTune was built with a lot of different tools, primarily:

React Native - frontend development and user interactivity
OpenCV - pupil-detection and movement tracking
PyTorch - run inference with model
Modal Labs - hosting and deploying
FastAPI/Python - backend server, LLM integration, NLP
Challenges we ran into
One of the major challenges we ran into was getting eye-tracking to work in real-time. At first, we developed our own pupil-recognition system with OpenCV. However, this system was slow and couldn't be effectively used in the app. We moved over to a new model (gaze-estimation) and invested heavy effort into making it run as fast as possible with low latency. Another challenge was designing the neuro-cognition system. The questions our system asked had to be relevant to users while still staying semi-randomized.

## Accomplishments that we're proud of
We're really proud of our eye-tracking system. We researched links between pupil movements and Alzheimer's to find the best method of detecting warning signs through pupil jitteriness. We're also proud of our accessible UI, meant to be easy to use by elderly patients, caretakers, and doctors.

## What we learned
We learned a lot about facial recognition and utilizing OpenCV for such recognition tasks. We also learned about using React Native for front-end app development.

## What's next for MindTune
In the future, we want to add even more cognitive tests and puzzles to help find more warning signs in users. We also want to expand the doctor portal to have more advanced analysis of patient data.
