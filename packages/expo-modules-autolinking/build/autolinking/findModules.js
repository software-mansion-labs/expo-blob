"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExpoModule = resolveExpoModule;
exports.findModulesAsync = findModulesAsync;
const ExpoModuleConfig_1 = require("../ExpoModuleConfig");
const dependencies_1 = require("../dependencies");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function resolveExpoModule(resolution, platform, excludeNames) {
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! resolve expo module ' + JSON.stringify(resolution) + '\n', { flag: 'a+' });
    if (excludeNames.has(resolution.name)) {
        fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', "!!! excluded :'( \n", { flag: 'a+' });
        return null;
    }
    const expoModuleConfig = await (0, ExpoModuleConfig_1.discoverExpoModuleConfigAsync)(resolution.path);
    if (expoModuleConfig && expoModuleConfig.supportsPlatform(platform)) {
        return {
            name: resolution.name,
            path: resolution.path,
            version: resolution.version,
            config: expoModuleConfig,
            duplicates: resolution.duplicates?.map((duplicate) => ({
                name: duplicate.name,
                path: duplicate.path,
                version: duplicate.version,
            })) ?? [],
        };
    }
    else {
        fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! resolution RIP ' + JSON.stringify(resolution) + ' \n', { flag: 'a+' });
        return null;
    }
}
async function localModulesSearchPaths(appRoot) {
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! search local Modules search paths :' + appRoot + '\n', { flag: 'a+' });
    const modulesPath = path_1.default.resolve(appRoot, 'ios/localModules');
    if (!fs_1.default.existsSync(modulesPath)) {
        return [];
    }
    const res = [];
    const recursivelyScanDirectories = async (dirPath) => {
        fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! recursive: ' + dirPath + '\n', { flag: 'a+' });
        res.push(dirPath);
        const dir = fs_1.default.opendirSync(dirPath);
        for await (const dirent of dir) {
            if (!dirent.isDirectory()) {
                continue;
            }
            const childPath = path_1.default.resolve(modulesPath, dirent.name);
            await recursivelyScanDirectories(childPath);
        }
    };
    await recursivelyScanDirectories(modulesPath);
    return res;
}
/** Searches for modules to link based on given config. */
async function findModulesAsync({ appRoot, autolinkingOptions, }) {
    const excludeNames = new Set(autolinkingOptions.exclude);
    // custom native modules should be resolved first so that they can override other modules
    const originalSearchPaths = autolinkingOptions.nativeModulesDir
        ? [autolinkingOptions.nativeModulesDir, ...autolinkingOptions.searchPaths]
        : autolinkingOptions.searchPaths;
    // console.log('GREPME');
    const searchPaths = [...(await localModulesSearchPaths(appRoot)), ...originalSearchPaths];
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! search paths:' + searchPaths + '\n', { flag: 'a+' });
    return (0, dependencies_1.filterMapResolutionResult)((0, dependencies_1.mergeResolutionResults)(await Promise.all([
        ...searchPaths.map((searchPath) => (0, dependencies_1.scanDependenciesInSearchPath)(searchPath)),
        (0, dependencies_1.scanDependenciesRecursively)(appRoot),
    ])), (resolution) => resolveExpoModule(resolution, autolinkingOptions.platform, excludeNames));
}
//# sourceMappingURL=findModules.js.map