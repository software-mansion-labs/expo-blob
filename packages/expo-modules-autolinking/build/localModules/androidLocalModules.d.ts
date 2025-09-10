export declare function getLocalModulesKotlinFilesPaths(): Promise<{
    path: string;
}[]>;
export declare function createSymlinksToKotlinFiles(mirrorPath: string): Promise<void>;
export declare function generateLocalModulesListFile(mirrorPath: string): Promise<void>;
