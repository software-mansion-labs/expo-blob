import { ExpoBlob as Blob } from 'expo-blob';
import { Text, View } from 'react-native';

export function ArrayBufferBlobTest() {
  const input_arr = new TextEncoder().encode('\u08B8\u000a');
  const blob = new Blob([input_arr]);

  blob.arrayBuffer().then((arrayBuffer: ArrayBufferLike) => {
    const result = new Uint8Array(arrayBuffer);
    console.log('solution:', result);
    console.log('expected:', input_arr);
  });

  return (
    <View>
      <Text>ArrayBuffer Blob Test - Look at the console log</Text>
    </View>
  );
}
