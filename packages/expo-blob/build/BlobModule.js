import { requireNativeModule } from 'expo';
import { normalizedContentType } from './utils';
const NativeBlobModule = requireNativeModule('ExpoBlob');
const isTypedArray = (v) => {
    return (v instanceof Int16Array ||
        v instanceof Int32Array ||
        v instanceof Int8Array ||
        v instanceof BigInt64Array ||
        v instanceof BigUint64Array ||
        v instanceof Uint16Array ||
        v instanceof Uint32Array ||
        v instanceof Uint8Array ||
        v instanceof Float32Array ||
        v instanceof Float64Array);
};
const getOptions = (options) => {
    let opt;
    if (options) {
        if (!(options instanceof Object)) {
            throw TypeError();
        }
        opt = {
            endings: options.endings,
            type: options.type === undefined ? '' : normalizedContentType(options.type),
        };
    }
    else {
        opt = options;
    }
    return opt;
};
export class ExpoBlob extends NativeBlobModule.Blob {
    constructor(blobParts, options) {
        const inputMapping = (v) => {
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
        }
        else if (blobParts === null || !(blobParts instanceof Object)) {
            throw TypeError();
        }
        else {
            super([...blobParts].map(inputMapping), getOptions(options));
        }
    }
    slice(start, end, contentType) {
        const normalizedType = normalizedContentType(contentType);
        const slicedBlob = super.slice(start, end, normalizedType);
        Object.setPrototypeOf(slicedBlob, ExpoBlob.prototype);
        return slicedBlob;
    }
    stream() {
        const uint8promise = super.bytes();
        let offset = 0;
        return new ReadableStream({
            async pull(controller) {
                let uint8 = await uint8promise;
                if (offset < uint8.length) {
                    controller.enqueue(uint8.subarray(offset));
                    offset = uint8.length;
                }
                else {
                    controller.close();
                }
            },
        });
    }
    async arrayBuffer() {
        return super
            .bytes()
            .then((bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    }
    toString() {
        return '[object Blob]';
    }
}
//# sourceMappingURL=BlobModule.js.map