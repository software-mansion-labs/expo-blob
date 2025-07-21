import { requireNativeModule } from "expo";
import { normalizedContentType } from "./utils";
const NativeBlobModule = requireNativeModule("ExpoBlob");
export class ExpoBlob extends NativeBlobModule.Blob {
    constructor(blobParts, options) {
        if (options) {
            options.type = normalizedContentType(options.type);
        }
        if (!blobParts) {
            super([], options);
        }
        else if (blobParts instanceof Array) {
            super(blobParts.flat(Infinity), options);
        }
        else {
            super(Array.from(blobParts).flat(Infinity), options);
        }
    }
    slice(start, end, contentType) {
        const normalizedType = contentType ? normalizedContentType(contentType) : "";
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
        return super.bytes().then((bytes) => bytes.buffer);
    }
}
//# sourceMappingURL=BlobModule.js.map