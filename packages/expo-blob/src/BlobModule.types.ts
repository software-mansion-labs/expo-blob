import { NativeModule, SharedObject } from 'expo';

import { ExpoBlob } from './BlobModule';

export declare class Blob {
  constructor(blobParts?: any, options?: BlobPropertyBag);

  slice(start?: number, end?: number, contentType?: string): Blob;
  stream(): ReadableStream;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBufferLike>;
}

export declare class NativeBlob extends SharedObject {
  readonly size: number;
  readonly type: string;
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);
  slice(start?: number, end?: number, contentType?: string): ExpoBlob;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
}

export declare class ExpoBlobModule extends NativeModule {
  Blob: typeof NativeBlob;
}

export type BlobPart = string | ArrayBuffer | ArrayBufferView | Blob;
