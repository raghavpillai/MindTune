import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View, ImageBackground, Animated } from "react-native";
import { TamaguiProvider } from "tamagui";
import config from "./tamagui.config";
import { Button, XStack, Image } from "tamagui";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Conversation from "./Conversation";


const Home = ({navigation}) => {

  const buttonsTranslateY = useRef(new Animated.Value(300)).current;
  const backgroundTranslateY = useRef(new Animated.Value(500)).current;
  const logoTranslateY = useRef(new Animated.Value(-300)).current;

  const [loaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  const startCheckInAnimations = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoTranslateY, {
          toValue: -300,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslateY, {
          toValue: 2000,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(backgroundTranslateY, {
        toValue: -800,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    navigation.navigate('Conversation');
  };

  useEffect(() => {
    if (loaded) {
      Animated.sequence([
        // First, execute these two animations in parallel.
        Animated.parallel([
          Animated.timing(logoTranslateY, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundTranslateY, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        // Once the parallel animations are done, execute this one.
        Animated.timing(buttonsTranslateY, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
      <View style={styles.container}>
        <Animated.View
          style={{
            ...styles.backgroundImageContainer,
            transform: [{ translateY: backgroundTranslateY }],
          }}
        >
          <ImageBackground
            source={require("./assets/backdrop.png")}
            resizeMode="cover"
            style={styles.backgroundImage}
          >
            <Animated.View
              style={{
                ...styles.logoContainer,
                transform: [{ translateY: logoTranslateY }],
              }}
            >
              <Image
                style={{
                  resizeMode: "cover",
                  height: 100,
                  width: 350,
                }}
                source={require("./assets/logo.png")}
              />
            </Animated.View>

          <Animated.View
            style={{
              ...styles.buttonContainer,
              transform: [{ translateY: buttonsTranslateY }],
            }}
          >
            <XStack style={styles.buttonSpacing}>
              <Button
                width="75%"
                height={60}
                fontSize={21}
                backgroundColor={"white"}
                color={"$blue9"}
                onPress={() => startCheckInAnimations()}
              >
                Check In
              </Button>
            </XStack>
            <XStack>
              <Button
                width="75%"
                height={60}
                fontSize={21}
                backgroundColor={"white"}
                color={"$blue9"}
              >
                See Your Progress
              </Button>
            </XStack>
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      <StatusBar style="auto" />
    </View>
  </TamaguiProvider>
  )
}

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} options={{ headerTitle: (props) => <></> }}/>
        <Stack.Screen name="Conversation" component={Conversation} options={{ headerTitle: (props) => <></> }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-end",
  },
  backgroundImageContainer: {
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  logoContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 100,
  },
  buttonSpacing: {
    marginBottom: 30,
  },
});
