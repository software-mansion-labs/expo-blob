import { ExpoBlob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../../components/HeadingText';
import MonoText from '../../../components/MonoText';
import { Page } from '../../../components/Page';
import { Q, S } from '@expo/html-elements';

type PerformanceTestData = {
  key: string;
  expoBlobCreation: () => ExpoBlob;
  blobCreation: () => Blob;
  blobOperation: (blob: Blob | ExpoBlob) => void;
  title: string;
};

const performanceTest: PerformanceTestData[] = [
  {
    key: '10_000 blob [100, 9_900) slice',
    blobCreation: () => {
      return new Blob(['a'.repeat(10_000)]);
    },
    expoBlobCreation: () => {
      return new ExpoBlob(['a'.repeat(10_000)]);
    },
    blobOperation: (blob: Blob | ExpoBlob) => {
      blob.slice(100, 9_900);
    },
    title: '10_000 blob [100, 9_900) slice',
  },
];

type ArrayBufferExampleItemProps = {
  example: PerformanceTestData;
  result: {
    blobTime: number;
    expoBlobTime: number;
  } | null;
  onEvaluate: (example: PerformanceTestData) => void;
};

function ArrayBufferExampleItem({ example, result, onEvaluate }: ArrayBufferExampleItemProps) {
  return (
    <View>
      <Text>{example.title}</Text>
      <View>
        {!result && <Button title="Evaluate" onPress={() => onEvaluate(example)} />}
        {result && (
          <MonoText containerStyle={styles.resultContainer}>
            <Text>Blob time: {result.blobTime}</Text> {'\n'}
            <Text>Expo Blob time: {result.expoBlobTime}</Text> {'\n'}
          </MonoText>
        )}
      </View>
    </View>
  );
}

export default function BlobArrayBufferScreen() {
  const [results, setResults] = useState<{
    [key: string]: {
      blobTime: number;
      expoBlobTime: number;
    } | null;
  }>({});

  const evaluatePerformanceTest = (example: PerformanceTestData) => {
    try {
      const expoBlob = example.expoBlobCreation();
      gc();
      const expoBlobT0 = performance.now();
      example.blobOperation(expoBlob);
      const expoBlobT1 = performance.now();

      const blob = example.blobCreation();
      gc();
      const blobT0 = performance.now();
      example.blobOperation(blob);
      const blobT1 = performance.now();

      setResults((prev) => ({
        ...prev,
        [example.key]: {
          blobTime: blobT1 - blobT0,
          expoBlobTime: expoBlobT1 - expoBlobT0,
        },
      }));
      // blob.text().then((text: string) => {
      //   blob.arrayBuffer().then((arrayBuffer: ArrayBufferLike) => {
      //     setResults((prev) => ({
      //       ...prev,
      //       [example.key]: {
      //         size: blob.size,
      //         type: blob.type,
      //         text,
      //         arrayBuffer,
      //         hexString: arrayBufferToHex(arrayBuffer),
      //       },
      //     }));
      //   });
      // });
    } catch (error) {
      console.error('Error creating blob or slicing it', error);
      setResults((prev) => ({
        ...prev,
        [example.key]: null,
      }));
    }
  };

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <HeadingText>ArrayBuffer Method</HeadingText>
          <MonoText>arrayBuffer()</MonoText>
        </View>
        <View style={styles.container}>
          <HeadingText>Examples:</HeadingText>
          <View style={styles.exmaplesContainer}>
            {performanceTest.map((example) => (
              <ArrayBufferExampleItem
                key={example.key}
                example={example}
                result={results[example.key]}
                onEvaluate={evaluatePerformanceTest}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {},
  scrollContainer: {
    paddingBottom: 20,
  },
  exmaplesContainer: {
    marginTop: 10,
    gap: 10,
  },
  exampleContent: {
    flexDirection: 'row',
  },
  resultContainer: {
    borderColor: '#229D2AFF',
    padding: 10,
    borderRadius: 5,
  },
});
