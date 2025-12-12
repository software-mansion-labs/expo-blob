import Server from '@expo/metro/metro/Server';
export interface ModuleGenerationArguments {
    projectRoot: string;
    metro: Server | null;
}
export declare function findUpPackageJsonDirectoryCached(cwd: string, directoryToPackage: Map<string, string>): string | undefined;
export declare function startModuleGenerationAsync({ projectRoot, metro, }: ModuleGenerationArguments): Promise<void>;
