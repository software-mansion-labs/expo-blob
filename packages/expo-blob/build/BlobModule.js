import { requireNativeModule } from "expo";
import { normalizedContentType } from "./utils";
const NativeBlobModule = requireNativeModule("ExpoBlob");
const isIterable = (obj) => {
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
};
export class ExpoBlob extends NativeBlobModule.Blob {
    constructor(blobParts, options) {
        if (options) {
            options.type = normalizedContentType(options.type);
        }
        const inputMapping = (v) => {
            if (v instanceof ArrayBuffer) {
                // TODO maybe do this natively not in typescript?
                return new Uint8Array(v);
            }
            if (typeof v === 'number') {
                // Manual type coercion?
                return String(v);
            }
            return v;
        };
        if (blobParts === undefined) {
            super([], options);
        }
        else if (!(blobParts instanceof Object)) {
            throw TypeError;
        }
        else if (blobParts instanceof Array) {
            super(blobParts.flat(Infinity).map(inputMapping), options);
        }
        else if (isIterable(blobParts)) {
            super(Array.from(blobParts).flat(Infinity).map(inputMapping), options);
        }
        else {
            throw TypeError;
        }
    }
    slice(start, end, contentType) {
        const normalizedType = normalizedContentType(contentType);
        const slicedBlob = super.slice(start, end, normalizedType);
        Object.setPrototypeOf(slicedBlob, ExpoBlob.prototype);
        return slicedBlob;
    }
    stream() {
        const text = super.syncText();
        const encoder = new TextEncoder();
        const uint8 = encoder.encode(text);
        let offset = 0;
        return new ReadableStream({
            pull(controller) {
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
        return super.bytes().then((bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    }
}
//# sourceMappingURL=BlobModule.js.map