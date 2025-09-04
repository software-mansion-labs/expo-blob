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

  const filePathRelativeToRoot = path.relative(projectRoot, absoluteFilePath);
  const moduleTypesFilePath = path.resolve(
    localModulesPath,
    trimExtension(filePathRelativeToRoot) + '.nativeModule.d.ts'
  );
  const viewTypesFilePath = path.resolve(
    localModulesPath,
    trimExtension(filePathRelativeToRoot) + '.nativeView.d.ts'
  );
  const viewExportPath = path.resolve(
    localModulesPath,
    trimExtension(filePathRelativeToRoot) + '.native.view.js'
  );
  const moduleExportPath = path.resolve(
    localModulesPath,
    trimExtension(filePathRelativeToRoot) + '.js'
  );
  const androidPath = path.resolve(androidLocalModulesPath, filePathRelativeToRoot);
  const iosFilePath = path.resolve(iosLocalModulesPath, filePathRelativeToRoot);
  return {
    moduleTypesFilePath,
    viewTypesFilePath,
    viewExportPath,
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

function swiftFileWatched(projectRoot: string, filePathAbsolute: string): boolean {
  for (const dir of swiftWatchedDirectories) {
    const realRoot = fs.realpathSync(projectRoot);
    const dirPathAbsolute = path.resolve(realRoot, dir);
    if (filePathAbsolute.startsWith(dirPathAbsolute)) {
      return true;
    }
  }
  return false;
}

export type LocalModulesMirror = {
  files: string[];
  swiftModuleClassNames: string[];
  kotlinClasses: string[];
};

const mirrorStateFileName = 'mirror.json';

export function getMirroStateObject(projectRoot: string): LocalModulesMirror {
  const { localModulesPath } = mirrorDirectories(projectRoot);
  const mirrorFilePath = path.resolve(localModulesPath, mirrorStateFileName);

  return JSON.parse(fs.readFileSync(mirrorFilePath).toString()) as LocalModulesMirror;
}

function saveMirrorStateObject(projectRoot: string, localModulesMirror: LocalModulesMirror) {
  const { localModulesPath } = mirrorDirectories(projectRoot);
  const mirrorFilePath = path.resolve(localModulesPath, mirrorStateFileName);

  console.log('saving the mirror object');
  fs.writeFileSync(mirrorFilePath, JSON.stringify(localModulesMirror));
}

function addNewFile(
  projectRoot: string,
  absoluteFilePath: string,
  mirrorStateObject: LocalModulesMirror = {
    files: [],
    swiftModuleClassNames: [],
    kotlinClasses: [],
  },
  filesWatched?: Set<string>
) {
  // if (localModulesMirror === null) {
  //   localModulesMirror = [];
  // }
  const {
    moduleTypesFilePath,
    viewTypesFilePath,
    viewExportPath,
    moduleExportPath,
    moduleName,
    androidPath,
    iosFilePath,
  } = typesAndLocalModulePaths(projectRoot, absoluteFilePath);

  mirrorStateObject.files.push(absoluteFilePath);

  if (absoluteFilePath.endsWith('.kt')) {
    fs.mkdirSync(path.dirname(androidPath), { recursive: true });
    fs.symlinkSync(absoluteFilePath, androidPath);
    mirrorStateObject.kotlinClasses.push('local.modules.' + moduleName);
  } else if (
    absoluteFilePath.endsWith('.swift') &&
    swiftFileWatched(projectRoot, absoluteFilePath)
  ) {
    // we no longer do that
    // fs.mkdirSync(path.dirname(iosFilePath), { recursive: true });
    // fs.symlinkSync(absoluteFilePath, iosFilePath);

    mirrorStateObject.swiftModuleClassNames.push(moduleName);
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
  fs.mkdirSync(path.dirname(moduleTypesFilePath), { recursive: true });

  fs.writeFileSync(
    viewExportPath,
    `import { requireNativeView } from 'expo';
import * as React from 'react';
export default requireNativeView("${moduleName}");`
  );

  fs.writeFileSync(
    moduleExportPath,
    `import { requireNativeModule } from 'expo';
import * as React from 'react';
export default requireNativeModule("${moduleName}");`
  );

  // fs.writeFile(newTypesFilePath, `declare module "*/${justFileName}" {}`);
  fs.writeFileSync(moduleTypesFilePath, 'const _default: any\nexport default _default');
  fs.writeFileSync(viewTypesFilePath, 'const _default: any\nexport default _default');
  console.log('asynchronously added file', moduleTypesFilePath, 'with module name', moduleName);
}

export async function generateMirrorDirectoriesAndUpdateXCodeProject(
  projectRoot: string,
  filesWatched?: Set<string>
) {
  console.log('generate mirror directories and update xcode proejct');
  createFreshMirrorDirectories(projectRoot);

  const mirrorStateObject: LocalModulesMirror = {
    files: [],
    swiftModuleClassNames: [],
    kotlinClasses: [],
  };
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
        addNewFile(projectRoot, absoluteDirentPath, mirrorStateObject, filesWatched);
      } else if (dirent.isDirectory()) {
        generateExportsAndTypesForDirectory(absoluteDirentPath);
      }
    }
  };
  await generateExportsAndTypesForDirectory(projectRoot);
  updateXCodeProject(projectRoot);
  saveMirrorStateObject(projectRoot, mirrorStateObject);
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
    const { moduleTypesFilePath, moduleExportPath, androidPath, iosFilePath } =
      typesAndLocalModulePaths(projectRoot, absoluteFilePath);
    if (absoluteFilePath.endsWith('.kt')) {
      removeFileAndEmptyDirectories(androidPath);
    } else if (
      absoluteFilePath.endsWith('.swift') &&
      swiftFileWatched(projectRoot, absoluteFilePath)
    ) {
      // we don't do that anymore
      // removeFileAndEmptyDirectories(iosFilePath);
    }

    filesWatched.delete(absoluteFilePath);
    if (!fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
      console.log('file is not watched under different extension');
      removeFileAndEmptyDirectories(moduleTypesFilePath);
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
            addNewFile(projectRoot, filePath, undefined, filesWatched);
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
