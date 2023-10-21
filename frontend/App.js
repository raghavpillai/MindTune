import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { TamaguiProvider } from 'tamagui'
import config from './tamagui.config'
import { Button, XStack, YStack, Image} from 'tamagui'
import logo from './assets/logo.png'

export default function App() {
  return (
    <TamaguiProvider config={config}>
      <View style={styles.container}>

      <YStack space width={"100%"} height={'50%'} alignItems='center'>
        <XStack>
          <Image
            style={{
              resizeMode: 'cover',
              height: 100,
              width: 350,
            }}
            source={require('./assets/logo.png')}
          />
        </XStack>
        <YStack space width={'60%'} height={200} alignItems='center' justifyContent='flex-end'>
          <XStack>
            <Button width='100%' backgroundColor={'$blue9'} color={'white'}>Start Daily Log</Button>
          </XStack>
          <XStack></XStack>
          <XStack>
          <Button width='100%' backgroundColor={'$blue9'} color={'white'}>Access Dashboard</Button>
          </XStack>
        </YStack>
      </YStack>

      <StatusBar style="auto" />
      </View>
    </TamaguiProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
