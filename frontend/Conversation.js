import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ImageBackground, Animated, Text, TouchableOpacity } from "react-native";
import { TamaguiProvider, TextArea } from "tamagui";
import config from "./tamagui.config";
import { Button, XStack, Image } from "tamagui";
import Icon from 'react-native-vector-icons/FontAwesome';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { FAST_API_URL } from "./constants";

const MAX_SCALE = 1.5; // maximum scale when loud
const MIN_SCALE = 0.4; // minimum scale when quiet
const MAX_DB = -10; // quite loud
const MIN_DB = -70; // very quiet

const Conversation = () => {
    const [recording, setRecording] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState('idle');
    const [audioPermission, setAudioPermission] = useState(null);
    const [curAudio, setCurAudio] = useState("");
    const [userSpokenText, setUserSpokenText] = useState("");
    const [timerDone, setTimerDone] = useState("");
    const [audioRefs, setAudioRefs] = useState({});

    const [microphoneScale] = useState(new Animated.Value(1));


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
        setCurAudio("");
    };

    const onStatusUpdate = (status) => {
        const normalizedValue = (status.metering - MIN_DB) / (MAX_DB - MIN_DB);

        const scaleValue = normalizedValue * (MAX_SCALE - MIN_SCALE) + MIN_SCALE;

        if (scaleValue > 1.3) {
            setCurAudio("listening...")
            setUserSpokenText(scaleValue.toString());
        } else {
            setCurAudio("start speaking...")
        }

        if (typeof scaleValue === 'number' && scaleValue > 0 && scaleValue < 2) {
            Animated.timing(microphoneScale, {
                toValue: scaleValue,
                duration: 3,
                useNativeDriver: true,
            }).start();
        }
    }


    useEffect(() => {
        // Simply get recording permission upon first render
        async function getPermission() {
            await Audio.requestPermissionsAsync().then((permission) => {
                console.log('Permission Granted: ' + permission.granted);
                setAudioPermission(permission.granted)
            }).catch(error => {
                console.log(error);
            });
        }

        // create_session
        async function createSession() {
            const data = {
                user_id: "john_doe"
            }
            const config = {
                responseType: 'stream'
            }
            const response = await axios.post(`${FAST_API_URL}/create_session/`, data, config);

            const stream = response.data;

            stream.on('data', data => {
                console.error(data);
            });

            stream.on('end', () => {
                console.error("stream done");
            });
        }

        function base64ToHex(base64String) {
            // Decode the base64 string to a Uint8Array (byte array)
            const byteArray = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));

            // Convert the byte array to a hex string
            return Array.from(byteArray).map(byte => byte.toString(16).padStart(2, '0')).join('');
        }

        async function createSession2() {
            try {
                const endpoint = `${FAST_API_URL}/api/v1/chat/create_session/`;
                const myParameter = 'john_doe';

                const response = fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: myParameter
                    })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                console.log(1);
                const reader = response.body.getReader();
                console.log(2);
                // Read the streaming response
                while (true) {
                    const { done, value } = await reader.read();
                    console.log(3);
                    if (done) {
                        console.log('Stream finished.');
                        break;
                    }

                    // Handle each chunk (this assumes it's text; adjust as necessary)
                    console.log(base64ToHex(value));
                }

            } catch (error) {
                console.error('Error making the request:', error);
            }
        }

        async function createSession3() {
            const endpoint = `${FAST_API_URL}/api/v1/chat/create_session/`;
            const response = await axios.get(endpoint, {
                headers: {},
                responseType: 'blob',
                user_id: "john_doe"
            });

            const stream = response.data;

            stream.on('data', data => {
                console.log(data);
            });

            stream.on('end', () => {
                console.log("stream done");
            });
        }

        async function createSession4() {
            console.log(2);
            async function* getIterableStream(
                body //: ReadableStream<Uint8Array>
            ) { // : AsyncIterable<string>
                const reader = body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    const decodedChunk = decoder.decode(value, { stream: true });
                    yield decodedChunk;
                }
            }
            console.log(3);
            const generateStream = async () => { // : Promise<AsyncIterable<string>>
                const response = await fetch(
                    `${FAST_API_URL}/api/v1/chat/create_session/?user_id=john_doe`,
                    {
                        method: 'GET',
                    }
                );
                console.log(response);
                if (response.status !== 200) throw new Error(response.status.toString());
                if (!response.body) throw new Error('Response body does not exist');
                return getIterableStream(response.body);
            }
            console.log(4);
            const stream = await generateStream();
            console.log(5);
            for await (const chunk of stream) {
                ;
                console.log(6);
                console.log(chunk);
            }
        }

        async function createSession5() {
            console.log(2);
            fetch(`${FAST_API_URL}/api/v1/chat/create_session/?user_id=john_doe`, { reactNative: { textStreaming: true } })
                .then(response => console.log(response))
                .then(stream => console.log(stream));
        }

        const createSession6 = async (message) => {
            try {
                console.log(2);
                const response = await fetch(`${FAST_API_URL}/api/v1/chat/create_session/?user_id=john_doe`);
                // if (!response.body) {
                //     throw new Error("ReadableStream not yet supported in this browser.");
                // }
                const reader = response.body.getReader();
                console.log(3);

                let receivedData = "";
                console.log(4);

                while (true) {
                    const { done, value } = await reader.read();
                    console.log(5);

                    if (done) {
                        break;
                    }
                    console.log(6);

                    receivedData += new TextDecoder().decode(value);
                    setOutput(receivedData);
                    console.log(output);
                    const elem = document.getElementById("output");
                    if (elem != null) {
                        elem.scrollTop = elem.scrollHeight;
                    }
                    console.log(7);
                }
            } catch (error) {
                console.error("Error fetching/streaming data:", error);
            }
        };

        console.log(0);
        // Call function to get permission
        getPermission();
        console.log(1);
        createSession6();
        console.log(99);

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

    useEffect(() => {
        const startYO = async () => {
            await setTimeout(() => {
                setTimerDone(true);
            }, 5000);
        }
        if (recordingStatus === 'recording') {
            startYO();
        }
    }, [recordingStatus])

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
            setTimerDone(false);
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
                            name={recording ? 'circle' : 'play'}
                            size={recording ? 150 : 150}
                            color="black"
                        />
                    </TouchableOpacity>
                </Animated.View>
                {!timerDone ? <Text style={styles.pText}>{curAudio}</Text> :
                <Button
                        onPress={handleRecordButtonPress}
                        textAlign='center'
                        fontSize={20}
                        width={140}
                        color={"black"}
                        backgroundColor={"transparent"}
                        borderWidth={1}
                        borderColor={"black"}
                        display={"block"}
                >submit</Button>
                }

                {recordingStatus === 'recording' &&
                <View flex={1} justifyContent={'flex-end'}>
                    <TextArea value={userSpokenText} width={350} height={150} marginBottom={30} borderWidth={1} borderColor="black"/>
                </View>
                }
            </View>
        </TamaguiProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    headerText: {
        fontSize: 30,
        marginTop: 100,
        paddingBottom: 100,
        fontWeight: 'bold',
    },
    pText: {
        fontSize: 20,
        padding: 30,
        minHeight: 30
    },
    microphoneContainer: {
        marginTop: 20,
    },
    microphoneButton: {
        padding: 20,
        borderRadius: 50,
    },
});

export default Conversation;