import { TypedArray } from 'expo-modules-core';

export declare class Blob {
  constructor(blobParts?: any, options?: BlobPropertyBag);

  slice(start?: number, end?: number, contentType?: string): Blob;
  stream(): ReadableStream;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBufferLike>;
}

export type BlobPart = string | TypedArray | ArrayBuffer | ArrayBufferView | Blob;
