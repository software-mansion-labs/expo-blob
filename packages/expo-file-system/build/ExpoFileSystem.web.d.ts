import { PickFileOptions } from './ExpoFileSystem.types';
declare class FileSystemFile {
    constructor();
    validatePath(): void;
    static pickFileAsync({ mimeTypes, multipleFiles }: PickFileOptions): Promise<File | File[]>;
}
declare class FileSystemDirectory {
    constructor();
}
declare const _default: {
    FileSystemDirectory: typeof FileSystemDirectory;
    FileSystemFile: typeof FileSystemFile;
    downloadFileAsync: () => Promise<void>;
    pickDirectoryAsync: () => Promise<void>;
    pickFileAsync: ({ mimeTypes, multipleFiles }: PickFileOptions) => Promise<File | File[]>;
    readonly totalDiskSpace: number;
    readonly availableDiskSpace: number;
    readonly documentDirectory: string;
    readonly cacheDirectory: string;
    readonly bundleDirectory: string;
};
export default _default;
//# sourceMappingURL=ExpoFileSystem.web.d.ts.map