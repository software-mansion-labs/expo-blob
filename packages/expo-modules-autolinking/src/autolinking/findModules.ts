import { discoverExpoModuleConfigAsync } from '../ExpoModuleConfig';
import { AutolinkingOptions } from '../commands/autolinkingOptions';
import {
  type DependencyResolution,
  scanDependenciesRecursively,
  scanDependenciesInSearchPath,
  filterMapResolutionResult,
  mergeResolutionResults,
} from '../dependencies';
import { PackageRevision, SearchResults, SupportedPlatform } from '../types';
import path from 'path';
import fs from 'fs';

export async function resolveExpoModule(
  resolution: DependencyResolution,
  platform: SupportedPlatform,
  excludeNames: Set<string>
): Promise<PackageRevision | null> {
  fs.writeFileSync(
    '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
    '!!! resolve expo module ' + JSON.stringify(resolution) + '\n',
    { flag: 'a+' }
  );

  if (excludeNames.has(resolution.name)) {
    fs.writeFileSync(
      '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
      "!!! excluded :'( \n",
      { flag: 'a+' }
    );
    return null;
  }
  const expoModuleConfig = await discoverExpoModuleConfigAsync(resolution.path);

  if (expoModuleConfig && expoModuleConfig.supportsPlatform(platform)) {
    return {
      name: resolution.name,
      path: resolution.path,
      version: resolution.version,
      config: expoModuleConfig,
      duplicates:
        resolution.duplicates?.map((duplicate) => ({
          name: duplicate.name,
          path: duplicate.path,
          version: duplicate.version,
        })) ?? [],
    };
  } else {
    fs.writeFileSync(
      '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
      '!!! resolution RIP ' + JSON.stringify(resolution) + ' \n',
      { flag: 'a+' }
    );
    return null;
  }
}

interface FindModulesParams {
  appRoot: string;
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform };
}

async function localModulesSearchPaths(appRoot: string): Promise<string[]> {
  fs.writeFileSync(
    '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
    '!!! search local Modules search paths :' + appRoot + '\n',
    { flag: 'a+' }
  );

  const modulesPath = path.resolve(appRoot, 'ios/localModules');
  if (!fs.existsSync(modulesPath)) {
    return [];
  }
  const res: string[] = [];

  const recursivelyScanDirectories = async (dirPath: string) => {
    fs.writeFileSync(
      '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
      '!!! recursive: ' + dirPath + '\n',
      { flag: 'a+' }
    );

    res.push(dirPath);
    const dir = fs.opendirSync(dirPath);
    for await (const dirent of dir) {
      if (!dirent.isDirectory()) {
        continue;
      }
      const childPath = path.resolve(modulesPath, dirent.name);
      await recursivelyScanDirectories(childPath);
    }
  };

  await recursivelyScanDirectories(modulesPath);

  return res;
}

/** Searches for modules to link based on given config. */
export async function findModulesAsync({
  appRoot,
  autolinkingOptions,
}: FindModulesParams): Promise<SearchResults> {
  const excludeNames = new Set(autolinkingOptions.exclude);

  // custom native modules should be resolved first so that they can override other modules
  const originalSearchPaths = autolinkingOptions.nativeModulesDir
    ? [autolinkingOptions.nativeModulesDir, ...autolinkingOptions.searchPaths]
    : autolinkingOptions.searchPaths;

  // console.log('GREPME');
  const searchPaths = [...(await localModulesSearchPaths(appRoot)), ...originalSearchPaths];
  fs.writeFileSync(
    '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
    '!!! search paths:' + searchPaths + '\n',
    { flag: 'a+' }
  );

  return filterMapResolutionResult(
    mergeResolutionResults(
      await Promise.all([
        ...searchPaths.map((searchPath) => scanDependenciesInSearchPath(searchPath)),
        scanDependenciesRecursively(appRoot),
      ])
    ),
    (resolution) => resolveExpoModule(resolution, autolinkingOptions.platform, excludeNames)
  );
}
