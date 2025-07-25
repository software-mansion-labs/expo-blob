import Foundation
import ExpoModulesCore

let kBlobChunkSize = 8192 * 2

public class Blob: SharedObject {
  var blobParts: [BlobPart]
  var options: BlobOptions

  static func chunkData(_ data: Data) -> [BlobPart] {
    var chunks: [BlobPart] = []
    var offset = 0
    while offset < data.count {
      let end = min(offset + kBlobChunkSize, data.count)
      let chunk = data.subdata(in: offset..<end)
      chunks.append(.data(chunk))
      offset = end
    }
    return chunks
  }

  static func chunkString(_ str: String) -> [BlobPart] {
    var parts: [BlobPart] = []
    var current = str.startIndex
    while current < str.endIndex {
      let next = str.index(current, offsetBy: kBlobChunkSize, limitedBy: str.endIndex) ?? str.endIndex
      let chunk = String(str[current..<next])
      if let data = chunk.data(using: .utf8) {
        parts.append(.data(data))
      }
      current = next
    }
    return parts
  }

  init(blobParts: [BlobPart]?, options: BlobOptions?) {
    var chunkedParts: [BlobPart] = []
    for part in blobParts ?? [] {
      switch part {
        case .data(let data):
          chunkedParts.append(contentsOf: Blob.chunkData(data))
        case .blob(let blob):
          chunkedParts.append(.blob(blob))
        case .string(let str):
          chunkedParts.append(contentsOf: Blob.chunkString(str))
      }
    }
    self.blobParts = chunkedParts
    self.options = options ?? BlobOptions()
  }

  var size: Int {
    return blobParts.reduce(0) { $0 + $1.size() }
  }

  var type: String {
    return options.type
  }

  func slice(start: Int, end: Int, contentType: String) -> Blob {
    let span = max(end - start, 0)
    let typeString = contentType
    if span == 0 {
      return Blob(blobParts: [], options: BlobOptions(type: typeString, endings: self.options.endings))
    }
    var dataSlice: [BlobPart] = []
    var currentPos = 0
    var remaining = span
    for part in blobParts {
      let partSize = part.size()
      if currentPos + partSize <= start {
        currentPos += partSize
        continue
      }
      if remaining <= 0 {
        break
      }
      let partStart = max(0, start - currentPos)
      let partEnd = min(partSize, partStart + remaining)
      let length = partEnd - partStart
      if length <= 0 {
        currentPos += partSize
        continue
      }
      if partStart == 0 && partEnd == partSize {
        dataSlice.append(part)
      } else {
        switch part {
          case .data(let data):
            let subData = data.subdata(in: partStart..<partEnd)
            dataSlice.append(.data(subData))
          case .blob(let blob):
            let subBlob = blob.slice(start: partStart, end: partEnd, contentType: blob.type)
            dataSlice.append(.blob(subBlob))
          case .string:
            break
        }
      }
      currentPos += partSize
      remaining -= length
    }
    return Blob(blobParts: dataSlice, options: BlobOptions(type: typeString, endings: self.options.endings))
  }

  func text() async -> String {
    var allBytes: [UInt8] = []
    for part in blobParts {
      switch part {
        case .data(let data):
          allBytes.append(contentsOf: [UInt8](data))
        case .blob(let blob):
          allBytes.append(contentsOf: await blob.bytes())
        case .string:
          break
      }
    }
    let data = Data(allBytes)
    if let str = String(data: data, encoding: .utf8) {
      return str
    } else {
      return String(repeating: "\u{FFFD}", count: data.count)
    }
  }
  
  func bytes() async -> [UInt8] {
    var result: [UInt8] = []
    for part in blobParts {
      result.append(contentsOf: await part.bytes())
    }
    return result
  }
}

enum EndingType: String, Enumerable {
  case transparent = "transparent"
  case native = "native"
}

struct BlobOptions: Record {
  @Field
  var type: String = ""
  @Field
  var endings: EndingType = .transparent
}
