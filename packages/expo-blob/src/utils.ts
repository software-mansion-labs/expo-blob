/**
 * Normalizes the content type string for a Blob.
 *
 * Returns the lowercased content type if it is valid, or an empty string otherwise.
 *
 * A valid content type:
 *  - Is not undefined
 *  - Contains only printable ASCII characters (0x20–0x7E)
 *
 * If any of these conditions are not met, returns an empty string to indicate an invalid or unsafe content type.
 *
 * @param type The content type string to normalize.
 * @returns The normalized (lowercased) content type, or an empty string if invalid.
 */
export function normalizedContentType(type?: string): string {
  const str = '' + type;
  const asciiPrintable = /^[\x20-\x7E]+$/;
  if (type === undefined || !asciiPrintable.test(str)) return '';
  return str.toLowerCase();
}

/**
 * @param obj The object to check whether it's a Typed Array or not.
 * @returns boolean indicating whether the obj is a Typed Array or not.
 */
export function isTypedArray(obj: any): boolean {
  return (
    obj instanceof Int8Array ||
    obj instanceof Int16Array ||
    obj instanceof Int32Array ||
    obj instanceof BigInt64Array ||
    obj instanceof Uint8Array ||
    obj instanceof Uint16Array ||
    obj instanceof Uint32Array ||
    obj instanceof BigUint64Array ||
    obj instanceof Float32Array ||
    obj instanceof Float64Array
  );
}

/**
 * Processes the options object and
 * @param options
 * @returns BlobPropertyBag object
 */
export const preprocessOptions = (options?: BlobPropertyBag): BlobPropertyBag | undefined => {
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
    if (e !== undefined && e !== 'native' && e !== 'transparent') {
      throw TypeError();
    }

    return {
      endings: e,
      type: normalizedContentType(t),
    };
  }

  return options;
};
