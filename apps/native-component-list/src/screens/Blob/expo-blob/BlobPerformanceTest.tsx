import { ExpoBlob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../../components/HeadingText';
import MonoText from '../../../components/MonoText';
import { Page } from '../../../components/Page';

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
    title: 'Slice',
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
  let comparison = null;
  if (result) {
    const { blobTime, expoBlobTime } = result;
    if (blobTime < expoBlobTime) {
      const diff = expoBlobTime - blobTime;
      const percent = (100 * diff) / expoBlobTime;
      comparison = `Blob is ${percent.toFixed(6)}% (${diff.toFixed(6)} ms) faster`;
    } else if (expoBlobTime < blobTime) {
      const diff = blobTime - expoBlobTime;
      const percent = (100 * diff) / blobTime;
      comparison = `ExpoBlob is ${percent.toFixed(6)}% (${diff.toFixed(6)} ms) faster`;
    } else {
      comparison = 'Both are equally fast';
    }
  }
  return (
    <View>
      <Text>{example.title}</Text>
      <View>
        {!result && <Button title="Evaluate" onPress={() => onEvaluate(example)} />}
        {result && (
          <MonoText containerStyle={styles.resultContainer}>
            <Text>Blob time: {result.blobTime.toFixed(6)} ms</Text> {'\n'}
            <Text>Expo Blob time: {result.expoBlobTime.toFixed(6)} ms</Text> {'\n'}
            <Text>{comparison}</Text>
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
  const iterations = 100;

  const evaluatePerformanceTest = (example: PerformanceTestData) => {
    try {
      let expoBlobTotal = 0;
      let blobTotal = 0;
      for (let i = 0; i < iterations; i++) {
        const expoBlob = example.expoBlobCreation();
        const expoBlobT0 = performance.now();
        example.blobOperation(expoBlob);
        const expoBlobT1 = performance.now();
        expoBlobTotal += expoBlobT1 - expoBlobT0;

        const blob = example.blobCreation();
        const blobT0 = performance.now();
        example.blobOperation(blob);
        const blobT1 = performance.now();
        blobTotal += blobT1 - blobT0;
      }
      setResults((prev) => ({
        ...prev,
        [example.key]: {
          blobTime: blobTotal / iterations,
          expoBlobTime: expoBlobTotal / iterations,
        },
      }));
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
  iterationsInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 4,
    minWidth: 60,
    marginLeft: 8,
  },
});
