import { ExpoBlob as Blob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

import HeadingText from '../../../components/HeadingText';
import MonoText from '../../../components/MonoText';
import { Page } from '../../../components/Page';

export default function BlobConstructorScreen() {
  const [results, setResults] = useState<{
    [key: string]: { size: number; type: string; text: string } | null;
  }>({});

  const evaluateBlob = (key: string, blobParts: any[], options?: any) => {
    try {
      const blob = new Blob(blobParts, options);
      blob.text().then((text: string) => {
        setResults((prev) => ({
          ...prev,
          [key]: {
            size: blob.size,
            type: blob.type,
            text,
          },
        }));
      });
    } catch (error) {
      console.error('Error creating blob:', error);
      setResults((prev) => ({
        ...prev,
        [key]: null,
      }));
    }
  };

  const handleEvaluate = (key: string, blobParts: any[], options?: any) => {
    evaluateBlob(key, blobParts, options);
  };

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
              {!results['nested'] && (
                <Button
                  title="Evaluate"
                  onPress={() => handleEvaluate('nested', ['a', 'bbb', 'd', ['edf', ['aaaa']]])}
                />
              )}
              {results['nested'] && (
                <MonoText containerStyle={styles.resultContainer}>
                  <Text>Size: {results['nested'].size}</Text> {'\n'}
                  <Text>Type: {results['nested'].type}</Text> {'\n'}
                  <Text>Text: {results['nested'].text}</Text>
                </MonoText>
              )}
            </View>
          </View>
          <View>
            <Text>Mixed Types Array</Text>
            <View>
              <MonoText>new ExpoBlob(["a", "bbb", new Uint8Array([64, 65, 66])])</MonoText>
              {!results['mixed'] && (
                <Button
                  title="Evaluate"
                  onPress={() =>
                    handleEvaluate('mixed', ['a', 'bbb', new Uint8Array([64, 65, 66])])
                  }
                />
              )}
              {results['mixed'] && (
                <MonoText containerStyle={styles.resultContainer}>
                  <Text>Size: {results['mixed'].size}</Text> {'\n'}
                  <Text>Type: {results['mixed'].type}</Text> {'\n'}
                  <Text>Text: {results['mixed'].text}</Text>
                </MonoText>
              )}
            </View>
          </View>
          <View>
            <Text>Blobs Array</Text>
            <View>
              <MonoText>new ExpoBlob([new ExpoBlob(["aaa"]), new ExpoBlob(["bbb"])])</MonoText>
              {!results['blobs'] && (
                <Button
                  title="Evaluate"
                  onPress={() => handleEvaluate('blobs', [new Blob(['aaa']), new Blob(['bbb'])])}
                />
              )}
              {results['blobs'] && (
                <MonoText containerStyle={styles.resultContainer}>
                  <Text>Size: {results['blobs'].size}</Text> {'\n'}
                  <Text>Type: {results['blobs'].type}</Text> {'\n'}
                  <Text>Text: {results['blobs'].text}</Text>
                </MonoText>
              )}
            </View>
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
  resultContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FBFBFBFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#229D2AFF',
  },
});
