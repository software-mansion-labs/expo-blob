import { ExpoBlob as Blob } from 'expo-blob';
import { View, Text, StyleSheet, Button } from 'react-native';

import HeadingText from '../../../components/HeadingText';
import MonoText from '../../../components/MonoText';
import { Page } from '../../../components/Page';

export default function BlobConstructorScreen() {
  return (
    <Page>
      <View style={styles.container}>
        <HeadingText>Blob Constructor</HeadingText>
        <MonoText>new ExpoBlob(blobParts?: any[], {'\n  '}options?: BlobPropertyBag)</MonoText>
      </View>
      <View style={styles.container}>
        <HeadingText>Examples:</HeadingText>
        <View style={styles.exmaplesContainer}>
          <View>
            <Text>Neasted Array</Text>
            <View>
              <MonoText>new ExpoBlob(["a", "bbb", "d", ["edf", ["aaaa"]]])</MonoText>
              <Button title={'Evaluate'} />
              <MonoText containerStyle={{ borderColor: 'green', borderWidth: 1 }}>Result</MonoText>
            </View>
          </View>
          <View>
            <Text>Mixed Types Array</Text>
            <MonoText>new ExpoBlob(["a", "bbb", new Uint8Array([64, 65, 66])])</MonoText>
          </View>
          <View>
            <Text>Blobs Array</Text>
            <MonoText>new ExpoBlob([new ExpoBlob(["aaa"]), new ExpoBlob(["bbb"])])</MonoText>
          </View>
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {},
  exmaplesContainer: {
    marginTop: 10,
    gap: 10,
  },
  exampleContent: {
    flexDirection: 'row',
  },
});
