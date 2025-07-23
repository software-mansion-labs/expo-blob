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
    if (options) {
        if (!(options instanceof Object)) {
            throw TypeError();
        }
        let e = options.endings;
        let t = options.type;
        if (e && typeof e === 'object') {
            e = String(e);
        }
        if (t && typeof t === 'object') {
            t = String(t);
        }
        return {
            endings: e,
            type: normalizedContentType(t),
        };
    }
    return options;
};
export class ExpoBlob extends NativeBlobModule.Blob {
    constructor(blobParts, options) {
        const inputMapping = (v) => {
            if (v instanceof ArrayBuffer) {
                console.log('AB');
                return new Uint8Array(v);
            }
            if (v instanceof ExpoBlob || isTypedArray(v)) {
                console.log('Blob | TypedArray');
                return v;
            }
            console.log('to String');
            return String(v);
        };
        let bps = [];
        if (blobParts === undefined) {
            super([], getOptions(options));
        }
        else if (blobParts === null || typeof blobParts !== 'object') {
            throw TypeError();
        }
        else {
            for (let bp of blobParts) {
                bps.push(inputMapping(bp));
            }
            super(bps, getOptions(options));
        }
    }
    slice(start, end, contentType) {
        const normalizedType = normalizedContentType(contentType);
        const slicedBlob = super.slice(start, end, normalizedType);
        Object.setPrototypeOf(slicedBlob, ExpoBlob.prototype);
        return slicedBlob;
    }
    stream() {
        const self = this;
        let offset = 0;
        let bytesPromise = null;
        return new ReadableStream({
            type: 'bytes',
            async pull(controller) {
                if (!bytesPromise) {
                    bytesPromise = self.bytes();
                }
                const bytes = await bytesPromise;
                if (offset >= bytes.length) {
                    controller.close();
                    return;
                }
                if (controller.byobRequest?.view) {
                    const view = controller.byobRequest.view;
                    const end = Math.min(offset + view.byteLength, bytes.length);
                    const chunk = bytes.subarray(offset, end);
                    view.set(chunk, 0);
                    controller.byobRequest.respond(chunk.length);
                    offset = end;
                    if (offset >= bytes.length) {
                        controller.close();
                    }
                    return;
                }
                const chunkSize = 65_536;
                const end = Math.min(offset + chunkSize, bytes.length);
                controller.enqueue(bytes.subarray(offset, end));
                offset = end;
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
Object.defineProperty(ExpoBlob, 'length', {
    value: 0,
    writable: false,
});
//# sourceMappingURL=BlobModule.js.map