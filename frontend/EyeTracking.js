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
    const [camOK, setCamOK] = useState(false);


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
            const response = await axios.post('http://0.0.0.0:8080/upload_video/', data);
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
    
    function timeout(delay) {
        return new Promise( res => setTimeout(res, delay) );
    }

    const handleButtonPress = async () => {
      if (isMoving) {
        setIsMoving(false);
        animatedValue.stopAnimation();
      } else {
        takeVideo();
        await timeout(1000);
        console.log("started")
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

            <>
            {!camOK && <Text style={styles.headerText2}>Make sure you've removed your glasses and your face is in frame</Text>}
            </>
            <>
            {camOK && <Text style={styles.headerText}>Try to follow the dot as it moves around the screen</Text>}
            </>
            <View style={camOK ? styles.cameraContainer2 : styles.cameraContainer}>
                <Camera
                ref={ref => setCamera(ref)}
                style={camOK ? styles.fixedRatio2 : styles.fixedRatio} 
                type={type}
                ratio={'4:3'} />
            </View>

            <>
            {camOK && 
            <View width="100%" height="100%" flex={1} borderColor={"gray"} borderWidth={1}>
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
            </View>
            }
            </>


            <View style={{alignItems: 'center', justifyContent: 'center', height: 140}}>
                <Button size="$6" onPress={() => setCamOK(true)}
                        textAlign='center'
                        fontSize={21}
                        width={175}
                        color={"white"}
                        backgroundColor={"$blue9"}
                        display={camOK ? "none" : "block"}
                >
                    Ready!
                </Button>
                <Button size="$6" onPress={handleButtonPress}
                        textAlign='center'
                        fontSize={21}
                        width={175}
                        color={"white"}
                        backgroundColor={"$blue9"}
                        display={camOK ? (isMoving ? "none" : (hasMoved ? "none" : "block")) : 'none'}
                >
                    Start
                </Button>
                <Button size="$6" onPress={() => stopVideo()}
                        textAlign='center'
                        fontSize={21}
                        width={175}
                        color={"white"}
                        backgroundColor={"$green8"}
                        display={hasMoved ? "block" : "none"}
                >
                    Continue
                </Button>
            </View>

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
    headerText2: {
        fontSize: 20,
        marginTop: 50,
        marginHorizontal: 10,
        paddingBottom: 100,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    bottomText: {
        fontSize: 20,
        marginTop: 70,
    },
    cameraContainer: {
        width: 300,
        height: 300,
        width: '100%',
        alignItems: 'center',
    },
    cameraContainer2: {
        width: 60,
        height: 60,
        width: '100%',
        alignItems: 'flex-start',
        position: 'absolute'
    },
    fixedRatio:{
        aspectRatio: 1,
        width: 100,
        height: 300
    },
    fixedRatio2:{
        aspectRatio: 1,
        width: 50,
        height: 50,
        opacity: 0.3
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