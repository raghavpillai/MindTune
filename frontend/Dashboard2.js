import { H1, TamaguiProvider, Slider } from "tamagui";
import { View, Text } from "react-native";
import config from "./tamagui.config";
import { Video } from "expo-av";
import { useRef, useState } from "react";
import React from "react";
import { Route } from "@react-navigation/routers";

const Dashboard2 = ({route}) => {

    const [size, setSize] = useState(4)

    return(
        <TamaguiProvider config={config}>
            <View alignItems='center' flex='1'>
                <H1 marginVertical={30}>Welcome back, John Doe!</H1>



            </View>
        </TamaguiProvider>
    );

}



export default Dashboard2;