import { ExpoBlob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../../components/HeadingText';
import MonoText from '../../../components/MonoText';
import { Page } from '../../../components/Page';

type PerformanceTestData = {
  key: string;
  blobOperation: () => void;
  expoBlobOperation: () => void;
  title: string;
};

const performanceTest: PerformanceTestData[] = [
  {
    key: '10_000 blob [100, 9_900) slice',
    blobOperation: () => {
      const arr = [];
      for (let i = 0; i < 5; i += 1) {
        arr.push('a'.repeat(1000000));
      }
      const blob = new Blob(arr);
      for (let i = 0; i < 10; i += 1) {
        blob.slice(i, 3900000 + i);
      }
    },
    expoBlobOperation: () => {
      const arr = [];
      for (let i = 0; i < 5; i += 1) {
        arr.push('a'.repeat(1000000));
      }
      const blob = new ExpoBlob(arr);
      for (let i = 0; i < 10; i += 1) {
        blob.slice(i, 3900000 + i);
      }
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
  const iterations = 10;

  const gc_now = () => {
    gc();
    gc();
  };

  const evaluatePerformanceTest = async (example: PerformanceTestData) => {
    try {
      let expoBlobTotal = 0;
      let blobTotal = 0;
      for (let i = 0; i < iterations; i++) {
        // const expoBlob = example.expoBlobCreation();

        gc_now();
        const blobT0 = performance.now();
        example.blobOperation();
        const blobT1 = performance.now();
        blobTotal += blobT1 - blobT0;

        gc_now();
        const expoBlobT0 = performance.now();
        example.expoBlobOperation();
        const expoBlobT1 = performance.now();
        expoBlobTotal += expoBlobT1 - expoBlobT0;
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
          <HeadingText>Performance tests:</HeadingText>
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
