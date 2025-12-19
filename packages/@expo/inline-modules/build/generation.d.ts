import Server from '@expo/metro/metro/Server';
interface ModuleGenerationArguments {
    projectRoot: string;
    metro: Server | null;
}
export declare function findUpPackageJsonDirectoryCached(cwd: string, directoryToPackage: Map<string, string>): string | undefined;
export declare function generateMirrorDirectories(projectRoot: string, filesWatched?: Set<string>, directoryToPackage?: Map<string, string>): Promise<void>;
export declare function startInlineModulesMetroWatcherAsync({ projectRoot, metro }: ModuleGenerationArguments, filesWatched?: Set<string>, directoryToPackage?: Map<string, string>): Promise<void>;
export {};
