import { Paths, File, Directory } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import {
  Button,
  ScrollView,
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';

import HeadingText from '../components/HeadingText';
import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';

FileSystemScreen.navigationOptions = {
  title: 'FileSystem',
};

export default function FileSystemScreen() {
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedDir, setPickedDir] = useState<Directory | null>(null);
  const [pickedDirs, setPickedDirs] = useState<Directory[] | null>(null);
  const [soemText, setSomeText] = useState<string>('Text: ');
  const [pickedFiles, setPickedFiles] = useState<File[] | null>(null);
  const { width } = useWindowDimensions();
  const [copyToCache, setCopyToCache] = React.useState(false);
  const [multiple, setMultiple] = React.useState(false);
  const [base64, setBase64] = React.useState(false);

  useEffect(() => {
    // try {
    //   const pd = Directory.pickDirectoryAsync();
    //   pd.then((dir) => {
    //     setPickedDir(dir as Directory);
    //     console.log(`dir name: ${(dir as Directory).name}`);
    //   });
    // } catch (error) {
    //   console.log(error);
    // }
    // try {
    //   const pf = File.pickFileAsync();
    //   pf.then((file) => {
    //     setPickedFile(file as File);
    //     console.log(`file name: ${(file as File).name}`);
    //   });
    // } catch (error) {
    //   console.log(error);
    // }
    console.log('!!!log');
    try {
      console.log('!!!try');
      const pfs = File.pickFileAsync({ multipleFiles: true });
      pfs.then((files: File[]) => {
        console.log('!!!then');
        setPickedFiles(files);
        console.log(`files count: ${files}
          files0 name: ${files[0]?.name}
          files1 name: ${files[1]?.name}
          `);
      });
      console.log('!!!endTry');
    } catch (error) {
      console.log(error);
    }
  }, []);

  const openPicker = async () => {
    try {
      const time = Date.now();
      let newFiles: File[] = [];

      // 2. Strict Overload Branching
      // By using a strict boolean literal in the options, TypeScript perfectly
      // infers whether it's getting a single File or a File[] back.
      if (multiple) {
        newFiles = await File.pickFileAsync({ multipleFiles: true });
      } else {
        const singleFile = await File.pickFileAsync({ multipleFiles: false });
        if (singleFile) {
          newFiles = [singleFile]; // Wrap the single file in an array for FlatList
        }
      }

      console.log(`Duration: ${Date.now() - time}ms`);
      console.log(`Results:`, newFiles);

      setPickedFiles(newFiles);
    } catch (err) {
      console.error('Error picking document:', err);
      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert(`Cancelled or Error: ${err}`);
        } else {
          Alert.alert('Error', `Cancelled or Error: ${err}`);
        }
      }, 150);
    }
  };
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.container}>
        <HeadingText>.contentUri property</HeadingText>
        <Button
          title="From file"
          onPress={async () => {
            const file = new File(Paths.cache, 'file.txt');
            file.write('123');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'text/plain',
            });
          }}
        />
        <Text>Open .pem certificate from BareExpo (should show modal that it's not possible)</Text>
        <Button
          title="From asset"
          onPress={async () => {
            const file = new File(Paths.bundle, 'expo-root.pem');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'application/x-pem-file',
            });
          }}
        />
        <Button
          title="From SAF"
          onPress={async () => {
            const res = await File.pickFileAsync();
            const file = Array.isArray(res) ? res[0] : res;
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: file.type,
            });
          }}
        />

        <View style={{ marginTop: 40, alignItems: 'center', width: '100%' }}>
          <HeadingText>File Picker (pickFileAsync)</HeadingText>

          <View
            style={{
              marginBottom: 20,
              marginTop: 10,
              paddingHorizontal: 20,
              gap: 5,
              minWidth: 300,
            }}>
            <Button onPress={openPicker} title="Open document picker" />
          </View>

          {/* Replaced FlatList with standard .map() to avoid ScrollView nesting warnings */}
          <View style={{ padding: 20, width: width - 40 }}>
            <Text>A view of {pickedFiles?.length ?? 0} files</Text>
            {pickedFiles?.map((file, index) => {
              const fileName = file.name || '';
              // Safely access uri since FileSystemFile has it, but standard Blob doesn't
              const fileUri = (file as any).uri;

              return (
                <View
                  key={`${index}-${fileUri || fileName}`}
                  style={{ marginBottom: 20, width: '100%' }}>
                  {fileName.match(/\.(png|jpg|jpeg)$/i) && fileUri ? (
                    <Image
                      source={{ uri: fileUri }}
                      resizeMode="cover"
                      style={{ width: 100, height: 100, marginBottom: 8 }}
                    />
                  ) : null}

                  <Text numberOfLines={1} ellipsizeMode="middle">
                    {fileName} {file.size ? `(${file.size / 1000} KB)` : ''}
                  </Text>

                  <Text numberOfLines={1} ellipsizeMode="middle">
                    URI: {fileUri}
                  </Text>

                  {file.type && (
                    <Text numberOfLines={1} ellipsizeMode="middle">
                      MimeType: {file.type}
                    </Text>
                  )}

                  {/* Assuming lastModified is exposed on your File class */}
                  {file.lastModified && <Text>Last Modified: {file.lastModified}</Text>}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageBox: {
    padding: 10,
    borderWidth: 1,
  },
  picker: {
    borderWidth: 1,
    padding: 0,
    margin: 0,
  },
  container: {
    padding: 10,
    gap: 10,
  },
});
