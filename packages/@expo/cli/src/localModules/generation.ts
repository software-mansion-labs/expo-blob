import { getConfig } from '@expo/config';
import Server from '@expo/metro/metro/Server';
import type MetroServer from '@expo/metro/metro/Server';
import fs from 'fs';
import path from 'path';
import { getPbxproj } from '@expo/config-plugins/build/ios/utils/Xcodeproj';

import { ensureDotExpoProjectDirectoryInitialized } from '../start/project/dotExpo';
import { getRouterDirectoryModuleIdWithManifest } from '../start/server/metro/router';

export interface ModuleGenerationArguments {
  projectRoot: string;
  metro: Server | null;
}

const nativeExtensions = ['.kt', '.swift'];
const swiftWatchedDirectories = ['app', 'src'];

function mirrorDirectories(projectRoot: string): {
  dotExpoDir: string;
  localModulesPath: string;
  androidLocalModulesPath: string;
  iosPath: string;
  iosLocalModulesPath: string;
  xcodeProjPath: string;
} {
  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const localModulesPath = path.resolve(dotExpoDir, './localModules/');
  const androidLocalModulesPath = path.resolve(
    projectRoot,
    'android/app/src/main/java/local/modules/'
  );
  const iosLocalModulesPath = path.resolve(projectRoot, 'ios/localModules');
  const xcodeProjPath = path.resolve(projectRoot, 'ios/sandbox.xcodeproj');
  const iosPath = path.resolve(projectRoot, 'ios');

  return {
    dotExpoDir,
    localModulesPath,
    androidLocalModulesPath,
    iosPath,
    iosLocalModulesPath,
    xcodeProjPath,
  };
}

function createFreshMirrorDirectories(projectRoot: string) {
  const { localModulesPath, androidLocalModulesPath, iosLocalModulesPath } =
    mirrorDirectories(projectRoot);

  // make sure the directories exist so we can remove them.
  fs.mkdirSync(localModulesPath, { recursive: true });
  fs.mkdirSync(androidLocalModulesPath, { recursive: true });
  fs.mkdirSync(iosLocalModulesPath, { recursive: true });

  fs.rmSync(localModulesPath, { recursive: true });
  fs.rmSync(androidLocalModulesPath, { recursive: true });
  fs.rmSync(iosLocalModulesPath, { recursive: true });

  fs.mkdirSync(localModulesPath, { recursive: true });
  fs.mkdirSync(androidLocalModulesPath, { recursive: true });
  fs.mkdirSync(iosLocalModulesPath, { recursive: true });
}

function trimExtension(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf('.'));
}

function typesAndLocalModulePaths(projectRoot: string, absoluteFilePath: string) {
  const { localModulesPath, androidLocalModulesPath, iosLocalModulesPath } =
    mirrorDirectories(projectRoot);
  const splitPath = absoluteFilePath.toString().split('/') ?? ['EmptyModule.kt'];
  const justFileName = splitPath?.at(-1) ?? 'EmptyModule.kt';
  const moduleName = trimExtension(justFileName);
  console.log(moduleName);

  const filePathRelativeToRoot = path.relative(projectRoot, absoluteFilePath);
  const typesFilePath = path.resolve(
    localModulesPath,
    trimExtension(filePathRelativeToRoot) + '.nativeModule.d.ts'
  );
  const moduleExportPath = path.resolve(
    localModulesPath,
    trimExtension(filePathRelativeToRoot) + '.js'
  );
  const androidPath = path.resolve(androidLocalModulesPath, filePathRelativeToRoot);
  const iosFilePath = path.resolve(iosLocalModulesPath, filePathRelativeToRoot);
  return {
    typesFilePath,
    moduleExportPath,
    moduleName,
    androidPath,
    iosFilePath,
  };
}

function fileWatchedWithAnyNativeExtension(
  absoluteFilePath: string,
  filesWatched: Set<string>
): boolean {
  const fileWithoutExtension = trimExtension(absoluteFilePath);
  for (const extension of nativeExtensions) {
    const fileToCheck = fileWithoutExtension + extension;
    if (filesWatched.has(fileToCheck)) {
      return true;
    }
  }
  return false;
}

function updateXCodeProject(projectRoot: string) {
  const pbxProject = getPbxproj(projectRoot);
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const mainTargetUUID = pbxProject.getFirstProject().firstProject.targets[0].value;

  const objects = pbxProject.hash.project.objects;

  const dirEntryExists = (dir: string): boolean => {
    if (!objects.PBXFileSystemSynchronizedRootGroup) {
      return false;
    }
    for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
      if (key.endsWith('_comment')) {
        continue;
      }
      if (
        path.relative('./', path.resolve('../', dir)) ===
        objects.PBXFileSystemSynchronizedRootGroup[key].path
      ) {
        return true;
      }
    }
    return false;
  };

  for (const dir of swiftWatchedDirectories) {
    if (dirEntryExists(dir)) {
      continue;
    }

    const newUUID = pbxProject.generateUuid();
    objects.PBXGroup[mainGroupUUID].children.push({
      value: newUUID,
      comment: dir,
    });

    if (!objects.PBXFileSystemSynchronizedRootGroup) {
      objects.PBXFileSystemSynchronizedRootGroup = {};
    }
    objects.PBXFileSystemSynchronizedRootGroup[newUUID + '_comment'] = dir;
    objects.PBXFileSystemSynchronizedRootGroup[newUUID] = {
      isa: 'PBXFileSystemSynchronizedRootGroup',
      explicitFileTypes: {},
      explicitFolders: [],
      name: dir,
      path: path.relative('./', path.resolve('../', dir)),
      sourceTree: 'SOURCE_ROOT',
    };

    const nativeTargetGroup = objects.PBXNativeTarget[mainTargetUUID];
    if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
      nativeTargetGroup.fileSystemSynchronizedGroups = [];
    }
    nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: newUUID, comment: dir });
  }

  fs.writeFileSync(pbxProject.filepath, pbxProject.writeSync());
}

function swiftFileWatched(projectRoot: string, file: string): boolean {
  for (const dir of swiftWatchedDirectories) {
    const dirPath = path.resolve(projectRoot, dir);
    const dirPathAbsolute = fs.realpathSync(dirPath);
    const filePathAbsolute = fs.realpathSync(file);
    if (filePathAbsolute.startsWith(dirPathAbsolute)) {
      return true;
    }
  }
  return false;
}

function addNewFile(projectRoot: string, absoluteFilePath: string, filesWatched?: Set<string>) {
  const { typesFilePath, moduleExportPath, moduleName, androidPath, iosFilePath } =
    typesAndLocalModulePaths(projectRoot, absoluteFilePath);
  if (absoluteFilePath.endsWith('.kt')) {
    fs.mkdirSync(path.dirname(androidPath), { recursive: true });
    fs.symlinkSync(absoluteFilePath, androidPath);
  } else if (
    absoluteFilePath.endsWith('.swift') &&
    swiftFileWatched(projectRoot, absoluteFilePath)
  ) {
    fs.mkdirSync(path.dirname(iosFilePath), { recursive: true });
    fs.symlinkSync(absoluteFilePath, iosFilePath);
  }

  if (filesWatched) {
    console.log('add filesWatched');
    if (fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
      console.log('file watched with different extension');
      filesWatched.add(absoluteFilePath);
      return;
    }
    filesWatched.add(absoluteFilePath);
  }

  fs.mkdirSync(path.dirname(moduleExportPath), { recursive: true });
  fs.mkdirSync(path.dirname(typesFilePath), { recursive: true });

  fs.writeFileSync(
    moduleExportPath,
    `import { requireNativeModule } from 'expo';
import * as React from 'react';
export default requireNativeModule("${moduleName}");`
  );
  // fs.writeFile(newTypesFilePath, `declare module "*/${justFileName}" {}`);
  fs.writeFileSync(typesFilePath, 'const _default: any\nexport default _default');
  console.log('asynchronously added file', typesFilePath, 'with module name', moduleName);
}

export async function generateMirrorDirectoriesAndUpdateXCodeProject(
  projectRoot: string,
  filesWatched?: Set<string>
) {
  createFreshMirrorDirectories(projectRoot);

  const generateExportsAndTypesForDirectory = async (absoluteDirPath: string) => {
    for (const glob of excludePathsGlobs(projectRoot)) {
      if (path.matchesGlob(absoluteDirPath, glob)) {
        return;
      }
    }

    const dir = fs.opendirSync(absoluteDirPath);
    for await (const dirent of dir) {
      const absoluteDirentPath = path.resolve(absoluteDirPath, dirent.name);
      if (dirent.isFile() && /\.(kt|swift)$/.test(dirent.name)) {
        addNewFile(projectRoot, absoluteDirentPath, filesWatched);
      } else if (dirent.isDirectory()) {
        generateExportsAndTypesForDirectory(absoluteDirentPath);
      }
    }
  };
  await generateExportsAndTypesForDirectory(projectRoot);
  updateXCodeProject(projectRoot);
}

function excludePathsGlobs(projectRoot: string): string[] {
  return [
    path.resolve(projectRoot, '.expo'),
    path.resolve(projectRoot, '.expo', './**'),
    path.resolve(projectRoot, '.expo', './**/*'),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(projectRoot, 'node_modules', './**'),
    path.resolve(projectRoot, 'node_modules', './**/*'),
    path.resolve(projectRoot, 'android'),
    path.resolve(projectRoot, 'localModules'),
    path.resolve(projectRoot, 'localModules', './**'),
    path.resolve(projectRoot, 'localModules', './**/*'),
    path.resolve(projectRoot, 'android'),
    path.resolve(projectRoot, 'android', './**'),
    path.resolve(projectRoot, 'android', './**/*'),
    path.resolve(projectRoot, 'ios'),
    path.resolve(projectRoot, 'ios', './**'),
    path.resolve(projectRoot, 'ios', './**/*'),
    path.resolve(projectRoot, 'modules'),
    path.resolve(projectRoot, 'modules', './**'),
    path.resolve(projectRoot, 'modules', './**/*'),
  ];
}

export async function startModuleGenerationAsync({
  projectRoot,
  metro,
}: ModuleGenerationArguments) {
  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const localModulesPath = path.resolve(dotExpoDir, './localModules/');
  const androidLocalModulesPath = path.resolve(
    projectRoot,
    'android/app/src/main/java/local/modules/'
  );
  const iosLocalModulesPath = path.resolve(projectRoot, 'ios/localModules');
  const { exp } = getConfig(projectRoot);
  const filesWatched = new Set<string>();

  const fileExcluded = (absolutePath: string) => {
    for (const glob of excludePathsGlobs(projectRoot)) {
      if (path.matchesGlob(absolutePath, glob)) {
        return true;
      }
    }
    return false;
  };

  createFreshMirrorDirectories(projectRoot);

  process.env.EXPO_ROUTER_APP_ROOT = path.join(
    projectRoot,
    getRouterDirectoryModuleIdWithManifest(projectRoot, exp)
  );

  const removeFileAndEmptyDirectories = (absoluteFilePath: string) => {
    console.log('remove File: ' + absoluteFilePath);
    if (fs.lstatSync(absoluteFilePath).isSymbolicLink()) {
      fs.unlinkSync(absoluteFilePath);
    } else {
      fs.rmSync(absoluteFilePath);
    }
    let dirNow: string = path.dirname(absoluteFilePath);
    while (fs.readdirSync(dirNow).length === 0 && dirNow !== dotExpoDir) {
      console.log('remove dir: ' + dirNow);
      fs.rmdirSync(dirNow);
      dirNow = path.dirname(dirNow);
    }
  };

  const onRemoveAppFile = (absoluteFilePath: string) => {
    const { typesFilePath, moduleExportPath, androidPath, iosFilePath } = typesAndLocalModulePaths(
      projectRoot,
      absoluteFilePath
    );
    if (absoluteFilePath.endsWith('.kt')) {
      removeFileAndEmptyDirectories(androidPath);
    } else if (
      absoluteFilePath.endsWith('.swift') &&
      swiftFileWatched(projectRoot, absoluteFilePath)
    ) {
      removeFileAndEmptyDirectories(iosFilePath);
    }

    filesWatched.delete(absoluteFilePath);
    if (!fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
      console.log('file is not watched under different extension');
      removeFileAndEmptyDirectories(typesFilePath);
      removeFileAndEmptyDirectories(moduleExportPath);
    }
  };

  const metroWatchKotlinAndSwiftFiles = async ({
    projectRoot,
    metro,
    eventTypes = ['add', 'change', 'delete'],
  }: {
    metro: MetroServer | null;
    projectRoot: string;
    eventTypes?: string[];
  }) => {
    const watcher = metro?.getBundler().getBundler().getWatcher();

    const listener = async ({
      eventsQueue,
    }: {
      eventsQueue: {
        filePath: string;
        metadata?: {
          type: 'f' | 'd' | 'l'; // Regular file / Directory / Symlink
        } | null;
        type: string;
      }[];
    }) => {
      for (const event of eventsQueue) {
        if (
          eventTypes.includes(event.type) &&
          event.metadata?.type !== 'd' &&
          !/node_modules/.test(event.filePath) &&
          /\.(kt|swift)$/.test(event.filePath) &&
          !fileExcluded(event.filePath)
        ) {
          const { filePath } = event;
          if (event.type === 'add') {
            addNewFile(projectRoot, filePath, filesWatched);
            console.log('add' + event.filePath);
          } else if (event.type === 'delete') {
            console.log('delete ' + event.filePath);
            await onRemoveAppFile(filePath);
          }
        }
      }
    };

    watcher?.addListener('change', listener);
    watcher?.addListener('add', listener);
    watcher?.addListener('remove', listener);

    await generateMirrorDirectoriesAndUpdateXCodeProject(projectRoot, filesWatched);
  };

  metroWatchKotlinAndSwiftFiles({
    projectRoot,
    metro,
    eventTypes: ['add', 'delete', 'change'],
  });
}
