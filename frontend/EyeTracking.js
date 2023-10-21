import { TamaguiProvider, Button } from "tamagui";
import config from "./tamagui.config";
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Easing, StyleSheet } from 'react-native';
import {AnimatedSprite} from 'react-native-animated-sprite'
import Logo from './assets/logo.png'

const EyeTracking = ({navigation}) => {

    const [isMoving, setIsMoving] = useState(false);
    const animatedValue = useRef(new Animated.Value(0)).current;
    const iterationCount = useRef(0);
    const [hasMoved, setHasMoved] = useState(false);
  
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
    

    return(
        <TamaguiProvider config={config}>
        <View style={styles.container}>
            <Text style={styles.headerText}>Try to follow the dot as it moves around the screen</Text>
            
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
      bottomText: {
        fontSize: 20,
        marginTop: 70,
      },
});

export default EyeTracking;