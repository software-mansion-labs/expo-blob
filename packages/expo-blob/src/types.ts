import { NativeModule, SharedObject } from 'expo';
import { Blob } from './BlobModule.types';

declare class NativeBlob extends SharedObject {
  readonly size: number;
  readonly type: string;
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);
  slice(start?: number, end?: number, contentType?: string): Blob;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
}

export declare class ExpoBlobModule extends NativeModule {
  Blob: typeof NativeBlob;
}
