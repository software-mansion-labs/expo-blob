import { Blob } from './BlobModule.types';
import { ExpoBlobModule } from './types';
declare const NativeBlobModule: ExpoBlobModule;
export declare class ExpoBlob extends NativeBlobModule.Blob implements Blob {
    constructor(blobParts?: any[] | Iterable<any>, options?: BlobPropertyBag);
    slice(start?: number, end?: number, contentType?: string): Blob;
    stream(): ReadableStream;
    arrayBuffer(): Promise<ArrayBufferLike>;
    toString(): string;
}
export {};
//# sourceMappingURL=BlobModule.d.ts.map