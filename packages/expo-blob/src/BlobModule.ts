import { NativeModule, requireNativeModule, SharedObject } from 'expo';
import { Blob, BlobPart } from './BlobModule.types';
import { normalizedContentType } from './utils';
declare class NativeBlob extends SharedObject {
  readonly size: number;
  readonly type: string;
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);
  slice(start?: number, end?: number, contentType?: string): ExpoBlob;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
  syncText(): string;
}

declare class ExpoBlobModule extends NativeModule {
  Blob: typeof NativeBlob;
}

const NativeBlobModule = requireNativeModule<ExpoBlobModule>('ExpoBlob');

const isTypedArray = (v: any): boolean => {
  return (
    v instanceof Int16Array ||
    v instanceof Int32Array ||
    v instanceof Int8Array ||
    v instanceof BigInt64Array ||
    v instanceof BigUint64Array ||
    v instanceof Uint16Array ||
    v instanceof Uint32Array ||
    v instanceof Uint8Array ||
    v instanceof Float32Array ||
    v instanceof Float64Array
  );
};

const getOptions = (options?: BlobPropertyBag) => {
  let opt;
  if (options) {
    if (!(options instanceof Object)) {
      throw TypeError();
    }

    opt = {
      endings: options.endings,
      type: options.type === undefined ? '' : normalizedContentType(options.type),
    };
  } else {
    opt = options;
  }

  return opt;
};

export class ExpoBlob extends NativeBlobModule.Blob implements Blob {
  constructor(blobParts?: any[] | Iterable<any>, options?: BlobPropertyBag) {
    const inputMapping = (v: any) => {
      if (v instanceof ArrayBuffer) {
        return new Uint8Array(v);
      }
      if (v instanceof ExpoBlob || isTypedArray(v)) {
        return v;
      }
      return String(v);
    };

    if (blobParts === undefined) {
      super([], getOptions(options));
    } else if (blobParts === null || !(blobParts instanceof Object)) {
      throw TypeError();
    } else {
      super([...blobParts].map(inputMapping), getOptions(options));
    }
  }

  slice(start?: number, end?: number, contentType?: string): ExpoBlob {
    const normalizedType = normalizedContentType(contentType);
    const slicedBlob = super.slice(start, end, normalizedType);
    Object.setPrototypeOf(slicedBlob, ExpoBlob.prototype);
    return slicedBlob;
  }

  stream(): ReadableStream {
    const uint8promise = super.bytes();
    let offset = 0;
    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        let uint8 = await uint8promise;
        if (offset < uint8.length) {
          controller.enqueue(uint8.subarray(offset));
          offset = uint8.length;
        } else {
          controller.close();
        }
      },
    });
  }

  async arrayBuffer(): Promise<ArrayBufferLike> {
    return super
      .bytes()
      .then((bytes: Uint8Array) =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      );
  }

  toString(): string {
    return '[object Blob]';
  }
}
