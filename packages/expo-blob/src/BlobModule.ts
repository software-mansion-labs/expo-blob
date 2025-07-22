import { NativeModule, requireNativeModule, SharedObject } from "expo";
import { Blob, BlobPart } from "./BlobModule.types";
import { normalizedContentType } from "./utils";
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

const NativeBlobModule = requireNativeModule<ExpoBlobModule>("ExpoBlob");

export class ExpoBlob extends NativeBlobModule.Blob implements Blob {
	constructor(blobParts?: any[] | Iterable<any>, options?: BlobPropertyBag) {
		let opt
		if (options) {
			if (!(options instanceof Object)) {
				throw TypeError()
			}

			opt = {
				endings: options.endings,
				type: options.type === undefined ? "" : normalizedContentType(options.type)
			}
		} else {
			opt = options
		}

		const inputMapping = (v : any) => {
			if (v instanceof ArrayBuffer) {
				// TODO maybe do this natively not in typescript?
				return new Uint8Array(v)
			}
			if (typeof v === 'number') {
				// Manual type coercion?
				return String(v)
			}
			return v
		}

		if (blobParts === undefined) {
			super([], opt);
		} else if (blobParts === null || !(blobParts instanceof Object)) {
			throw TypeError();
		} else {
			super([...blobParts].flat(Infinity).map(inputMapping), opt);
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
				let uint8 = await uint8promise
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
		return super.bytes().then((bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
	}

	toString(): string {
   	 	return "[object Blob]"
  	}
}
