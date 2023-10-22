import { TamaguiProvider, Button } from "tamagui";
import config from "./tamagui.config";
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Easing, StyleSheet, Button as Btn } from 'react-native';
import {AnimatedSprite} from 'react-native-animated-sprite'
import Logo from './assets/logo.png'
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from "axios";
import { FAST_API_URL } from "./constants";

const EyeTracking = ({navigation}) => {

    const [isMoving, setIsMoving] = useState(false);
    const animatedValue = useRef(new Animated.Value(0)).current;
    const iterationCount = useRef(0);
    const [hasMoved, setHasMoved] = useState(false);
  
    const [hasCameraPermission, setHasCameraPermission] =useState(null);
    const [hasAudioPermission, setHasAudioPermission] = useState(null);
    const [camera, setCamera] = useState(null);
    const [record, setRecord] = useState(null);
    const [type, setType] = useState(Camera.Constants.Type.front);    


    useEffect(() => {
        (async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermission(cameraStatus.status === 'granted');
            const audioStatus = await Camera.requestMicrophonePermissionsAsync();
            setHasAudioPermission(audioStatus.status === 'granted');
        })();
    }, []);

    useEffect(() => {
        const sendVideo = async () => {
            if(record) {
                // Create a file name for the recording
                const fileName = `video-${Date.now()}.mov`;

                // Move the recording to the new directory with the new file name
                await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'videos/', { intermediates: true });
                await FileSystem.moveAsync({
                    from: record,
                    to: FileSystem.documentDirectory + 'videos/' + `${fileName}`
                });

                // upload the uri and send the post
                uploadVideo(FileSystem.documentDirectory + 'videos/' + `${fileName}`);
            }
        }
        sendVideo();
    }, [record])

    const takeVideo = async () => {
    if(camera){
        const data = await camera.recordAsync()
        setRecord(data.uri);
        console.log(data.uri);
    }
    }

    const stopVideo = async () => {
        camera.stopRecording();
    }

    const uploadVideo = async (videoURI) => {
        if (!videoURI) return;

        const data = new FormData();
        data.append('file', {
            uri: videoURI,
            name: 'video.mov',
            type: 'video/mov',
        });

        try {
            const response = await axios.post(`${FAST_API_URL}/upload_video/`, data);
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


    const handleButtonPress = () => {
      if (isMoving) {
        setIsMoving(false);
        animatedValue.stopAnimation();
      } else {
        setIsMoving(true);
        iterationCount.current = 0;
        startAnimation();
      }
    };
  
    const startAnimation = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 750, // Move left for 2 seconds (adjust as needed)
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 2,
          duration: 750, // Move down for 2 seconds (adjust as needed)
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
            toValue: 3,
            duration: 1500, // Move up for 2 seconds (adjust as needed)
            easing: Easing.linear,
            useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
            toValue: 4,
            duration: 1500, // Move up for 2 seconds (adjust as needed)
            easing: Easing.linear,
            useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
            toValue: 5,
            duration: 1500, // Move up for 2 seconds (adjust as needed)
            easing: Easing.linear,
            useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
            toValue: 6,
            duration: 750, // Move up for 2 seconds (adjust as needed)
            easing: Easing.linear,
            useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
            toValue: 7,
            duration: 750, // Move up for 2 seconds (adjust as needed)
            easing: Easing.linear,
            useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          iterationCount.current++;
          if (iterationCount.current < 1) {
            // Start the animation again for one iteration
            animatedValue.setValue(0);
            startAnimation();
          } else {
            // Animation is done after one iteration
            setIsMoving(false);
          }
          setHasMoved(true);
        }
      });
    };
  
    const interpolatedX = animatedValue.interpolate({
      inputRange: [0, 1, 2, 3, 4, 5, 6, 7],
      outputRange: [160, 0, 0, 320, 320, 0, 0, 160], // Adjust the starting and ending positions
    });
  
    const interpolatedY = animatedValue.interpolate({
      inputRange: [0, 1, 2, 3, 4, 5, 6, 7],
      outputRange: [160, 160, 0, 0, 320, 320, 160, 160], // Adjust the starting and ending positions
    });
    
    const video = React.useRef(null);
    const [status, setStatus] = React.useState({});

    return(
        <TamaguiProvider config={config}>
        <View style={styles.container}>
            <Text style={styles.headerText}>Try to follow the dot as it moves around the screen</Text>
            

            <View style={styles.cameraContainer}>
                <Camera 
                ref={ref => setCamera(ref)}
                style={styles.fixedRatio} 
                type={type}
                ratio={'4:3'} />
            </View>

            <Btn title="Take video" onPress={() => takeVideo()} />
            <Btn title="Stop Video" onPress={() => stopVideo()} />


            <Video
            ref={video}
            style={styles.video}
            source={{
                uri: record,
            }}
            useNativeControls
            resizeMode="contain"
            isLooping
            onPlaybackStatusUpdate={status => setStatus(() => status)}
            />
            <View style={styles.buttons}>
            <Btn
                title={status.isPlaying ? 'Pause' : 'Play'}
                onPress={() =>
                status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
                }
            />
            </View>

            {/* <View width="100%" height="100%" flex={1} borderColor={"gray"} borderWidth={1}>
            <Animated.View
                style={{
                position: 'absolute',
                left: interpolatedX,
                top: interpolatedY
                }}
            >
                <Image
                source={require('./assets/dot.png')}
                style={{ width: 70, height: 70 }}
                />
            </Animated.View>
            </View> */}


{/* 
            <View style={{alignItems: 'center', justifyContent: 'center', height: 140}}>
                <Button size="$6" onPress={handleButtonPress}
                        textAlign='center'
                        fontSize={21}
                        width={175}
                        color={"white"}
                        backgroundColor={"$blue9"}
                        display={isMoving ? "none" : (hasMoved ? "none" : "block")}
                >
                    Start
                </Button>
                <Button size="$6" onPress={() => navigation.navigate('Home')}
                        textAlign='center'
                        fontSize={21}
                        width={175}
                        color={"white"}
                        backgroundColor={"$green8"}
                        display={hasMoved ? "block" : "none"}
                >
                    Continue
                </Button>
            </View> */}

        </View>
      </TamaguiProvider>
    );
}


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
        textAlign: 'center',
      },
      bottomText: {
        fontSize: 20,
        marginTop: 70,
      },
      cameraContainer: {
        flex: 1,
        flexDirection: 'row'
    },
    fixedRatio:{
        flex: 1,
        aspectRatio: 1
    },
    video: {
      alignSelf: 'center',
      width: 350,
      height: 220,
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
});

export default EyeTracking;