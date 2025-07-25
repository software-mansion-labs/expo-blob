import { Asset } from 'expo-asset';
import { ExpoBlob } from 'expo-blob';
import { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

import HeadingText from '../../../components/HeadingText';
import MonoText from '../../../components/MonoText';
import { Page } from '../../../components/Page';

type PerformanceTestData = {
  key: string;
  blobOperation: () => Promise<void>;
  expoBlobOperation: () => Promise<void>;
  title: string;
  iterations: number;
};

const performanceTest: PerformanceTestData[] = [
  {
    key: 'basic-test',
    blobOperation: async () => {
      const blob = new Blob(['abcd'.repeat(5000)]);
      blob.slice(0, 1000);
    },
    expoBlobOperation: async () => {
      const blob = new ExpoBlob(['abcd'.repeat(5000)]);
      blob.slice(0, 1000);
    },
    title: 'String Test',
    iterations: 100,
  },
  {
    key: 'bmp-file-test',
    blobOperation: async () => {
      const asset = Asset.fromModule(
        require('../../../../assets/expo-blob/performance-test-2mb.bmp')
      );
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const text = await response.text();
      const blob = new Blob([text]);
      blob.slice(0, 1000);
    },
    expoBlobOperation: async () => {
      const asset = Asset.fromModule(
        require('../../../../assets/expo-blob/performance-test-2mb.bmp')
      );
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const text = await response.text();
      const blob = new ExpoBlob([text]);
      blob.slice(0, 1000);
    },
    title: 'File Test (2MB BMP)',
    iterations: 25,
  },
  {
    key: 'audio-file-test',
    blobOperation: async () => {
      const asset = Asset.fromModule(
        require('../../../../assets/expo-blob/performance-test-1mb.mp3')
      );
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const text = await response.text();
      const blob = new Blob([text]);
      blob.slice(0, 1000);
    },
    expoBlobOperation: async () => {
      const asset = Asset.fromModule(
        require('../../../../assets/expo-blob/performance-test-1mb.mp3')
      );
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const text = await response.text();
      const blob = new ExpoBlob([text]);
      blob.slice(0, 1000);
    },
    title: 'File Test (1MB Audio)',
    iterations: 25,
  },
  {
    key: 'video-file-test',
    blobOperation: async () => {
      const asset = Asset.fromModule(
        require('../../../../assets/expo-blob/performance-test-1mb.mp4')
      );
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const text = await response.text();
      const blob = new Blob([text]);
      blob.slice(0, 1000);
    },
    expoBlobOperation: async () => {
      const asset = Asset.fromModule(
        require('../../../../assets/expo-blob/performance-test-1mb.mp4')
      );
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const response = await fetch(uri);
      const text = await response.text();
      const blob = new ExpoBlob([text]);
      blob.slice(0, 1000);
    },
    title: 'File Test (1MB Video)',
    iterations: 25,
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
          <View>
            <MonoText containerStyle={styles.resultContainer}>
              <Text>Blob time: {result.blobTime.toFixed(6)} ms</Text> {'\n'}
              <Text>Expo Blob time: {result.expoBlobTime.toFixed(6)} ms</Text> {'\n'}
              <Text>{comparison}</Text>
            </MonoText>
            <Button title="Re-evaluate" onPress={() => onEvaluate(example)} />
          </View>
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

  const evaluatePerformanceTest = async (example: PerformanceTestData) => {
    try {
      let expoBlobTotal = 0;
      let blobTotal = 0;
      for (let i = 0; i < example.iterations; i++) {
        const expoBlobT0 = performance.now();
        await example.expoBlobOperation();
        const expoBlobT1 = performance.now();
        expoBlobTotal += expoBlobT1 - expoBlobT0;

        const blobT0 = performance.now();
        await example.blobOperation();
        const blobT1 = performance.now();
        blobTotal += blobT1 - blobT0;
      }
      setResults((prev) => ({
        ...prev,
        [example.key]: {
          blobTime: blobTotal / example.iterations,
          expoBlobTime: expoBlobTotal / example.iterations,
        },
      }));
    } catch (error) {
      console.error('Error in performance test', error);
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
