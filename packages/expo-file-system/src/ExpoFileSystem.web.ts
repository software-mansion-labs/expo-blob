import { Platform } from 'expo-modules-core';
import { PickFileOptions } from './ExpoFileSystem.types';

class FileSystemFile {
  constructor() {
    console.warn('expo-file-system is not supported on web');
  }

  validatePath() {
    console.warn('validate path');
  }

  static pickFileAsync({ mimeTypes, multipleFiles }: PickFileOptions): Promise<File | File[]> {
    // SSR guard
    if (!Platform.isDOMAvailable) {
      return Promise.reject('DOM unavailable!');
    }

    const input = document.createElement('input');
    input.style.display = 'none';
    input.setAttribute('type', 'file');
    input.setAttribute('accept', mimeTypes?.join(',') ?? '*/*');
    input.setAttribute('id', String(Math.random()));
    if (multipleFiles) {
      input.setAttribute('multiple', 'multiple');
    }

    document.body.appendChild(input);

    return new Promise((resolve, reject) => {
      console.log('add event listener');
      input.addEventListener('change', async () => {
        if (input.files) {
          const files: File[] = [];
          for (const file of input.files) {
            files.push(file);
          }
          console.log('resolve with files!' + files.length);
          console.log('resolve with files!' + files.length);
          resolve(files);
        } else {
          reject('Picking was cancelled!');
        }

        document.body.removeChild(input);
      });

      input.addEventListener('cancel', () => {
        reject('Picking was canceled!');
      });

      const event = new MouseEvent('click');
      input.dispatchEvent(event);
    });
  }
}

class FileSystemDirectory {
  constructor() {
    console.warn('expo-file-system is not supported on web');
  }
}

export default {
  FileSystemDirectory,
  FileSystemFile,
  downloadFileAsync: () => {
    console.warn('expo-file-system is not supported on web');
    return Promise.resolve();
  },
  pickDirectoryAsync: () => {
    console.warn('expo-file-system is not supported on web');
    return Promise.resolve();
  },
  pickFileAsync: ({ mimeTypes, multipleFiles }: PickFileOptions): Promise<File | File[]> => {
    // SSR guard
    if (!Platform.isDOMAvailable) {
      return Promise.reject('DOM unavailable!');
    }

    const input = document.createElement('input');
    input.style.display = 'none';
    input.setAttribute('type', 'file');
    input.setAttribute('accept', mimeTypes?.join(',') ?? '*/*');
    input.setAttribute('id', String(Math.random()));
    if (multipleFiles) {
      input.setAttribute('multiple', 'multiple');
    }

    document.body.appendChild(input);

    return new Promise((resolve, reject) => {
      console.log('add event listener');
      input.addEventListener('change', async () => {
        if (input.files) {
          const files: File[] = [];
          for (const file of input.files) {
            files.push(file);
          }
          console.log('resolve with files!' + files.length);
          console.log('resolve with files!' + files.length);
          resolve(files);
        } else {
          reject('Picking was cancelled!');
        }

        document.body.removeChild(input);
      });

      input.addEventListener('cancel', () => {
        reject('Picking was canceled!');
      });

      const event = new MouseEvent('click');
      input.dispatchEvent(event);
    });
  },
  get totalDiskSpace(): number {
    console.warn('expo-file-system is not supported on web');
    return 0;
  },
  get availableDiskSpace(): number {
    console.warn('expo-file-system is not supported on web');
    return 0;
  },
  get documentDirectory(): string {
    console.warn('expo-file-system is not supported on web');
    return '';
  },
  get cacheDirectory(): string {
    console.warn('expo-file-system is not supported on web');
    return '';
  },
  get bundleDirectory(): string {
    console.warn('expo-file-system is not supported on web');
    return '';
  },
};
