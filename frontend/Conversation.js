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

const Conversation = () => {
    const [recording, setRecording] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState('idle');
    const [audioPermission, setAudioPermission] = useState(null);

    const [isRecording, setIsRecording] = useState(false);
    const microphoneScale = new Animated.Value(1);

    const startRecordingAnim = () => {
        setIsRecording(true);
        // Start the animation
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
            ]),
            { iterations: -1 }
        ).start();
        handleRecordButtonPress();
    };

    const stopRecordingAnim = () => {
        setIsRecording(false);
        // Stop the animation
        microphoneScale.stopAnimation();
    };


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

        // Call function to get permission
        getPermission()
        // Cleanup upon first render
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

            const newRecording = new Audio.Recording();
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

                // This is for simply playing the sound back
                const playbackObject = new Audio.Sound();
                await playbackObject.loadAsync({ uri: FileSystem.documentDirectory + 'recordings/' + `${fileName}` });
                await playbackObject.playAsync();

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
            const response = await axios.post('http://0.0.0.0:8080/upload_audio/', data);
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
        marginVertical: 50,
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

export default Conversation;