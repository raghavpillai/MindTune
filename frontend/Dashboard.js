import { TamaguiProvider } from "tamagui";
import { View } from "react-native";
import config from "./tamagui.config";


const Dashboard = () => {

    return(
        <TamaguiProvider config={config}>
            <View></View>
        </TamaguiProvider>
    );

}


export default Dashboard;