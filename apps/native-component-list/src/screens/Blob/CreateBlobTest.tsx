import { ExpoBlob as Blob } from 'expo-blob';
import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

export function CreateBlobTestComponent() {
  const [blobText, setBlobText] = useState<string | null>(null);
  const blob = new Blob(['a', 'b', ['c', 'd']], {
    type: 'test/plain',
    endings: 'native',
  });

  const mixedBlob = new Blob([blob, 'abc'], {
    type: 'test/plain',
    endings: 'native',
  });

  mixedBlob?.text().then((text: string) => {
    setBlobText(text);
  });

  return (
    <View style={styles.container}>
      <Text>Size: {mixedBlob?.size}</Text>
      <Text>Type: {mixedBlob?.type}</Text>
      <Text>Text: {blobText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
