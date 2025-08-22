"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDependenciesInSearchPath = scanDependenciesInSearchPath;
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("./utils");
async function resolveDependency(basePath, dependencyName, shouldIncludeDependency) {
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! resolve dependecny \n', { flag: 'a+' });
    if (!shouldIncludeDependency(dependencyName)) {
        fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! NO Should Include Dependency\n', { flag: 'a+' });
        return null;
    }
    const originPath = (0, utils_1.fastJoin)(basePath, dependencyName);
    const realPath = await (0, utils_1.maybeRealpath)(originPath);
    const packageJson = await (0, utils_1.loadPackageJson)((0, utils_1.fastJoin)(realPath || originPath, 'package.json'));
    if (packageJson) {
        return {
            source: 1 /* DependencyResolutionSource.SEARCH_PATH */,
            name: packageJson.name,
            version: packageJson.version || '',
            path: realPath || originPath,
            originPath,
            duplicates: null,
            depth: 0,
        };
    }
    else if (realPath) {
        return {
            source: 1 /* DependencyResolutionSource.SEARCH_PATH */,
            name: dependencyName.toLowerCase(),
            version: '',
            path: realPath,
            originPath,
            duplicates: null,
            depth: 0,
        };
    }
    else {
        fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! NO else\n', {
            flag: 'a+',
        });
        return null;
    }
}
async function scanDependenciesInSearchPath(rawPath, { shouldIncludeDependency = utils_1.defaultShouldIncludeDependency } = {}) {
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! scan dependencies in path: ' + rawPath + '\n', { flag: 'a+' });
    const rootPath = await (0, utils_1.maybeRealpath)(rawPath);
    const searchResults = Object.create(null);
    if (!rootPath) {
        return searchResults;
    }
    const resolvedDependencies = [];
    const dirents = await fs_1.default.promises.readdir(rootPath, { withFileTypes: true });
    await Promise.all(dirents.map(async (entry) => {
        fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! inside map ' + JSON.stringify(entry) + '\n', { flag: 'a+' });
        if (entry.isSymbolicLink()) {
            fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! is symlink ' + JSON.stringify(entry) + '\n', { flag: 'a+' });
            const resolution = await resolveDependency(rootPath, entry.name, shouldIncludeDependency);
            if (resolution)
                resolvedDependencies.push(resolution);
        }
        else if (entry.isDirectory()) {
            if (entry.name === 'node_modules') {
                // Ignore nested node_modules folder
            }
            if (entry.name[0] === '.') {
                // Ignore hidden folders
            }
            else if (entry.name[0] === '@') {
                // NOTE: We don't expect @-scope folders to be symlinks
                const entryPath = (0, utils_1.fastJoin)(rootPath, entry.name);
                const childEntries = await fs_1.default.promises.readdir(entryPath, { withFileTypes: true });
                await Promise.all(childEntries.map(async (child) => {
                    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! map \n', { flag: 'a+' });
                    const dependencyName = `${entry.name}/${child.name}`;
                    if (child.isDirectory() || child.isSymbolicLink()) {
                        fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! dir or symlink \n', { flag: 'a+' });
                        const resolution = await resolveDependency(rootPath, dependencyName, shouldIncludeDependency);
                        fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! resolution ' + JSON.stringify(resolution) + '\n', { flag: 'a+' });
                        if (resolution)
                            resolvedDependencies.push(resolution);
                    }
                }));
            }
            else {
                fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! other else \n', { flag: 'a+' });
                const resolution = await resolveDependency(rootPath, entry.name, shouldIncludeDependency);
                fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! resolution ' + JSON.stringify(resolution) + '\n', { flag: 'a+' });
                if (resolution)
                    resolvedDependencies.push(resolution);
            }
        }
    }));
    for (let idx = 0; idx < resolvedDependencies.length; idx++) {
        const resolution = resolvedDependencies[idx];
        const prevEntry = searchResults[resolution.name];
        if (prevEntry != null && resolution.path !== prevEntry.path) {
            (prevEntry.duplicates ?? (prevEntry.duplicates = [])).push({
                name: resolution.name,
                version: resolution.version,
                path: resolution.path,
                originPath: resolution.originPath,
            });
        }
        else if (prevEntry == null) {
            searchResults[resolution.name] = resolution;
        }
    }
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! \n', {
        flag: 'a+',
    });
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! searchResults ' + JSON.stringify(searchResults) + '\n', { flag: 'a+' });
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! \n', {
        flag: 'a+',
    });
    return searchResults;
}
//# sourceMappingURL=scanning.js.map