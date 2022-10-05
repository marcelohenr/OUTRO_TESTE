import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, Button } from 'react-native';

// Utils
import ConnectTcp from './src/utils/ConnectTcp';

// Consts
import { TCP_PORT, TCP_IP } from './src/consts/YPC99';


const options = {
  port: TCP_PORT,
  host: TCP_IP,
  localAddress: '127.0.0.1',
  reuseAddress: true,
};


export default function App() {
  const [image, setImage] = useState('');
  const [isButtonDisable, setIsButtonDisable] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [hasError, setHasError] = useState<any>(null);

  const callback = (frame: string) => {
    const img = `data:image/jpg;base64,${frame}`;
    setImage(img);
  }

  const callbackError = (error: Error) => {
    setHasError(error);
    setIsButtonDisable(false);
    console.log('[DEBUG]', error);
  };
  const callbackClose = () => {
    console.log('[DEBUG] CLOSED');
    setIsButtonDisable(false);
    setIsClosed(true);
  };

  // useEffect(() => {
  //   fetch('https://httpbin.org/get')
  //   .then((response) => console.log('[DEBUG]', JSON.stringify(response)))
  //   .catch(error => console.log('[ERROR]', error))
  // }, []);

  return (
    <View style={styles.container}>
      {isClosed && <Text>Connection Closed</Text>}
      <Text>YPC99 - SDK TESTING [0.0.1]</Text>
      <Button
        title='Connect'
        disabled={isButtonDisable}
        onPress={() => {
          setIsClosed(false);
          setIsButtonDisable(true);
          setHasError(null)
          setImage('');
          ConnectTcp(options, callback, callbackError, callbackClose)
        }}
      />
      {hasError && <Text style={styles.errorMessage}>hasError: {hasError}</Text>}
      {
        image && isButtonDisable && (
          <Image
            style={{ width: '100%', height: '50%' }}
            source={{ uri: image }}
          />
        )
      }
      <StatusBar style="auto" />
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessage: {
    maxWidth: 300
  }
});
