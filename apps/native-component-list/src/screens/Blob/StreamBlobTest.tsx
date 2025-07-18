import { ExpoBlob as Blob } from 'expo-blob';
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

export function StreamBlobTestComponent() {
  const [blobText, setBlobText] = useState<string | null>(null);
  const [streamedBlobArray, setStreamedBlobArray] = useState<Uint8Array>();

  const blob = new Blob(['aaa', 'bbbb'], {
    type: 'test/plain',
    endings: 'native',
  }).slice(0, 5);

  blob.text().then((text: string) => {
    setBlobText(text);
  });

  readStream(blob.stream()).then((data: Uint8Array) => {
    setStreamedBlobArray(data);
  });

  useEffect(() => {
    blob.slice(2, 5).stream();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Size: {blob?.size}</Text>
      <Text>Type: {blob?.type}</Text>
      <Text>Text: {blobText}</Text>
      <Text>Stream: {streamedBlobArray}</Text>
    </View>
  );
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
