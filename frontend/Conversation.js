import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ImageBackground, Animated, Text, TouchableOpacity } from "react-native";
import { TamaguiProvider } from "tamagui";
import config from "./tamagui.config";
import { Button, XStack, Image } from "tamagui";
import Icon from 'react-native-vector-icons/FontAwesome';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { FAST_API_URL } from "./constants";
import io from 'socket.io-client';

const MAX_SCALE = 1.5; // maximum scale when loud
const MIN_SCALE = 0.8; // minimum scale when quiet
const MAX_DB = -10; // quite loud
const MIN_DB = -60; // very quiet

const Conversation = () => {
    const [recording, setRecording] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState('idle');
    const [audioPermission, setAudioPermission] = useState(null);
    const [audioRefs, setAudioRefs] = useState({});
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [textResponse, setTextResponse] = useState('');

    const [microphoneScale] = useState(new Animated.Value(1));

    const mp3Path = FileSystem.documentDirectory + 'temporary.mp3';

    let sound = new Audio.Sound();

    async function play() {
        console.log("play");
        try {
            if (!sound._loaded) {
                await sound.loadAsync({ uri: mp3Path });
                await sound.playAsync();
            } else {
                await sound.playFromPositionAsync(0);
            }
        } catch (error) {
            console.error("Error playing audio:", error);
        }
    }

    const startRecordingAnim = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(microphoneScale, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(microphoneScale, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopRecordingAnim = () => {
        microphoneScale.stopAnimation();
    };

    const onStatusUpdate = (status) => {
        const normalizedValue = (status.metering - MIN_DB) / (MAX_DB - MIN_DB);

        const scaleValue = normalizedValue * (MAX_SCALE - MIN_SCALE) + MIN_SCALE;

        console.log(scaleValue);

        if (typeof scaleValue === 'number' && scaleValue > 0 && scaleValue < 2) {
            Animated.timing(microphoneScale, {
                toValue: scaleValue,
                duration: 5,
                useNativeDriver: true,
            }).start();
        }
    }

    const [soundBuffer, setSoundBuffer] = useState('');  // Maintain base64 buffer
    const soundRef = useRef(null);  // Sound instance reference

    const playChunk = (chunk) => {
        // Append the chunk to the existing buffer
        setSoundBuffer(prevBuffer => prevBuffer + chunk);

        if (soundRef.current) {
            soundRef.current.release();
        }

        const soundInstance = new Sound(
        `data:audio/mp3;base64,${soundBuffer}`,
        null,
        (error) => {
            if (error) {
            console.warn('failed to load the sound', error);
            return;
            }

            soundRef.current.play((success) => {
            if (!success) {
                console.warn('Sound did not play successfully');
            }
            });
        }
    )};


    useEffect(() => {
        async function getPermission() {
            await Audio.requestPermissionsAsync().then((permission) => {
                console.log('Permission Granted: ' + permission.granted);
                setAudioPermission(permission.granted)
            }).catch(error => {
                console.log(error);
            });
        }
        
        console.log(1);
        const socketIo = io("ws://0.0.0.0:8080", {
            transports: ["websocket"],
            path: "/ws/socket.io",
        });
        console.log(2);
        socketIo.on('chatbot', (result) => {
            let parsedResult = JSON.parse(result);
            let type = parsedResult.type

            if(type == "text") {
                console.log(parsedResult.text)
                setTextResponse(result.text);
            }else if (type == "chunk") {
                console.log("Got chunk with length " + parsedResult.chunk.length)
                console.log(parsedResult.chunk)
                playChunk(parsedResult.chunk)
            }

        });

        socketIo.emit('chatbot', {
            "user_id": "john_doe",
            "command": "create_session"
        });

        setSocket(socketIo);

        getPermission();
        return () => {
            if (recording) {
                stopRecording();
            }
        };
    }, []);


    async function startRecording() {
        try {
            // needed for IoS
            if (audioPermission) {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true
                })
            }
            startRecordingAnim();
            const newRecording = new Audio.Recording();
            newRecording.setOnRecordingStatusUpdate(onStatusUpdate);
            newRecording.setProgressUpdateInterval(10);
            console.log('Starting Recording')
            await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
            await newRecording.startAsync();
            setRecording(newRecording);
            setRecordingStatus('recording');

        } catch (error) {
            console.error('Failed to start recording', error);
        }
    }

    async function stopRecording() {
        try {
            if (recordingStatus === 'recording') {
                console.log('Stopping Recording')
                await recording.stopAndUnloadAsync();
                const recordingUri = recording.getURI();

                stopRecordingAnim();

                // Create a file name for the recording
                const fileName = `recording-${Date.now()}.caf`;

                // Move the recording to the new directory with the new file name
                await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
                await FileSystem.moveAsync({
                    from: recordingUri,
                    to: FileSystem.documentDirectory + 'recordings/' + `${fileName}`
                });

                // upload the uri and send the post
                uploadAudio(FileSystem.documentDirectory + 'recordings/' + `${fileName}`);

                // // This is for simply playing the sound back
                // const playbackObject = new Audio.Sound();
                // await playbackObject.loadAsync({ uri: FileSystem.documentDirectory + 'recordings/' + `${fileName}` });
                // await playbackObject.playAsync();


                // resert our states to record again
                setRecording(null);
                setRecordingStatus('stopped');
            }
        } catch (error) {
            console.error('Failed to stop recording', error);
        }
    }

    async function handleRecordButtonPress() {
        if (recording) {
            const audioUri = await stopRecording(recording);
            if (audioUri) {
                console.log('Saved audio file to', savedUri);
            }
        } else {
            await startRecording();
        }
    }

    const uploadAudio = async (audioUri) => {
        if (!audioUri) return;

        const data = new FormData();
        data.append('file', {
            uri: audioUri,
            name: 'audio.caf',
            type: 'audio/caf',
        });

        try {
            const response = await axios.post(`${FAST_API_URL}/api/v1/upload_audio/`, data);
            console.log('Uploaded and transcribed: ', response.data);
        } catch (error) {
            console.error('Error uploading:', error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Request data:', error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
            }
        }
    };

    return (
        <TamaguiProvider config={config}>
            <View style={styles.container}>
                <Text style={styles.headerText}>How's your day going?</Text>
                <Animated.View
                    style={[
                        styles.microphoneContainer,
                        { transform: [{ scale: microphoneScale }] },
                    ]}
                >
                    <TouchableOpacity
                        onPress={handleRecordButtonPress}
                        style={styles.microphoneButton}
                    >
                        <Icon
                            name={recording ? 'microphone' : 'microphone-slash'}
                            size={200}
                            color="red"
                        />
                    </TouchableOpacity>
                </Animated.View>
                {!timerDone ? <Text style={styles.pText}>{curAudio}</Text> :
                <Button
                        onPress={handleRecordButtonPress}
                        textAlign='center'
                        fontSize={20}
                        width={140}
                        marginTop={40}
                        color={"black"}
                        backgroundColor={"transparent"}
                        borderWidth={1}
                        borderColor={"black"}
                        display={"block"}
                >submit</Button>
                }

                {/* {Object.keys(audioRefs).map(peerId => (
                    <audio key={peerId} controls autoPlay ref={audioRefs[peerId]} style={{ display: 'none' }}></audio>
                ))} */}
            </View>
        </TamaguiProvider>
    )
}
export default Conversation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    headerText: {
        fontSize: 30,
        marginTop: 50,
        paddingBottom: 100,
        fontWeight: 'bold',
    },
    microphoneContainer: {
        marginTop: 20,
    },
    microphoneButton: {
        padding: 20,
        borderRadius: 50,
    },
});

