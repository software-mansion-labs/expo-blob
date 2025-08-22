import { getConfig } from '@expo/config';
import Server from '@expo/metro/metro/Server';
import type MetroServer from '@expo/metro/metro/Server';
import fs from 'fs';
import path from 'path';
import {
  addBuildSourceFileToGroup,
  getPbxproj,
} from '@expo/config-plugins/build/ios/utils/Xcodeproj';

import { ensureDotExpoProjectDirectoryInitialized } from '../start/project/dotExpo';
import { getRouterDirectoryModuleIdWithManifest } from '../start/server/metro/router';
import { expoConfig } from '../config';
import { PBXGroup, UUID } from 'xcode';
import { createBuildSourceFile } from '@expo/config-plugins/build/ios/XcodeProjectFile.js';

export interface ModuleGenerationArguments {
  projectRoot: string;
  metro: Server | null;
}
const nativeExtensions = ['.kt', '.swift'];

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

  fs.rmSync(localModulesPath, { recursive: true });
  fs.rmSync(androidLocalModulesPath, { recursive: true });

  fs.mkdirSync(localModulesPath, { recursive: true });
  fs.mkdirSync(androidLocalModulesPath, { recursive: true });
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

function addNewChildToParethesisList(children: string, child: string): string {
  return `(
  ${child}
  )`;
}

function updateXCodeProject(projectRoot: string) {
  return;
  const { iosLocalModulesPath, iosPath, xcodeProjPath } = mirrorDirectories(projectRoot);

  let pbxProject = getPbxproj(projectRoot);
  // pbxProject.removePbxGroup('localModules');
  // const localModulesGroup = pbxProject.pbxCreateGroup('localModules', '');
  // pbxProject.addPbxGroup(
  //   [path.resolve(iosLocalModulesPath, 'ExpoBlob.swift')],
  //   'localModules',
  //   'localModules'
  // );
  // let pbxProjectFirst = pbxProject.getFirstProject().firstProject;
  //   pbxProjectFirst.mainGroup.

  const newUUID = pbxProject.generateUuid();
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const mainTargetUUID = pbxProject.getFirstProject().firstProject.targets[0].value;
  // console.log('main target uuid', mainTargetUUID);

  // console.log(pbxProject.hash.project.objects.PBXFileSystemSynchronizedRootGroup);

  pbxProject.hash.project.objects.PBXGroup[mainGroupUUID];
  // pbxProject.pbxItemByComment()
  pbxProject.hash.project.objects.PBXGroup[mainGroupUUID].children.push({
    value: newUUID,
    comment: 'localModules',
  });

  const objects = pbxProject.hash.project.objects;

  if (!objects.PBXFileSystemSynchronizedRootGroup) {
    objects.PBXFileSystemSynchronizedRootGroup = {};
  }
  pbxProject.hash.project.objects.PBXFileSystemSynchronizedRootGroup[newUUID + '_comment'] =
    'localModules';
  pbxProject.hash.project.objects.PBXFileSystemSynchronizedRootGroup[newUUID] = {
    isa: 'PBXFileSystemSynchronizedRootGroup',
    explicitFileTypes: {},
    explicitFolders: [],
    path: 'localModules',
    sourceTree: '"<group>"',
  };

  // console.log(pbxProject.hash.project.objects.PBXFileSystemSynchronizedRootGroup[newUUID]);

  const nativeTargetGroup = pbxProject.hash.project.objects.PBXNativeTarget[mainTargetUUID];
  // console.log(nativeTargetGroup);
  if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
    nativeTargetGroup.fileSystemSynchronizedGroups = [];
  }
  nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: newUUID, comment: 'localModules' });

  // pbxProject.pbxCreateGroup('Test', 'Test');
  // console.log(pbxProject.getPBXObject('Test'));

  // pbxProject = addBuildSourceFileToGroup({
  //   filepath: path.resolve(iosLocalModulesPath, 'ExpoBlob.swift'),
  //   groupName: 'localModules',
  //   project: pbxProject,
  // });

  // pbxProject = createBuildSourceFile({
  //   project: pbxProject,
  //   nativeProjectRoot: iosPath,
  //   filePath: 'fun.swift',
  //   fileContents: 'akjgbnajkg',
  // });

  // pbxProject.addPbxGroup()

  // pbxProject.pbxCreateGroup('hejoEjo', '""');
  fs.writeFileSync(pbxProject.filepath, pbxProject.writeSync());
  // const generateXCodeGroup = async (iosMirrorPath: string, currentGroup: UUID) => {
  //   if (iosMirrorPath === '.' || iosMirrorPath === '..') {
  //     return;
  //   }

  //   const dir = fs.opendirSync(iosMirrorPath);
  //   for await (const dirent of dir) {
  //     const absoluteDirentPath = path.resolve(iosMirrorPath, dirent.name);
  //     console.log('currently visiting dirent: ' + absoluteDirentPath);
  //     if (dirent.isFile() && /\.swift$/.test(dirent.name)) {
  //       console.log('adding file to xcode');
  //       pbxProject.addFile(absoluteDirentPath, 'localModules');
  //     } else if (dirent.isDirectory()) {
  //       // pbxProject.pbxCreateGroup();
  //       await generateXCodeGroup(absoluteDirentPath, currentGroup);
  //     }
  //   }
  // };

  // await generateXCodeGroup(iosLocalModulesPath, localModulesGroup);
  // fs.writeFileSync(pbxProject.filepath, pbxProject.writeSync());
}

function addNewFileToXCodeProject(projectRoot: string, absoluteFilePath: string) {
  // const { iosPath } = mirrorDirectories(projectRoot);
  // const { iosFilePath } = typesAndLocalModulePaths(projectRoot, absoluteFilePath);

  const pbxProject = getPbxproj(projectRoot);
  // const newFileUUID = pbxProject.generateUuid();
  // const buildFileUUID = pbxProject.generateUuid();
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const mainTargetUUID = pbxProject.getFirstProject().firstProject.targets[0].value;
  const fileName = path.basename(absoluteFilePath);
  // const fileRelativeToIos = path.relative(iosPath, absoluteFilePath);

  const objects = pbxProject.hash.project.objects;

  // pbxProject.addToPbxFileReferenceSection(fileName);
  // pbxProject.addFile(absoluteFilePath, mainGroupUUID);

  // now this works if we're only dealign with source files not with groups
  // and we're not cleaning up any added files that may have been removed when the watcher was offline

  // pbxProject.addPbxGroup();
  // const groupUUID = pbxProject.pbxCreateGroup('testGroup', 'testGroup');
  // const group1UUID = pbxProject.pbxCreateGroup('testGroup1', 'testGroup/testGroup1');

  // pbxProject.addToPbxGroup(
  //   {
  //     isa: 'PBXGroup',
  //     children: [],
  //     name: 'testGroup',
  //     path: 'testGroup',
  //     sourceTree: '"<group>"',
  //   },
  //   mainGroupUUID
  // );

  pbxProject.removeSourceFile(
    absoluteFilePath,
    {
      target: mainTargetUUID,
    },
    mainGroupUUID
  );

  pbxProject.addSourceFile(
    absoluteFilePath,
    {
      target: mainTargetUUID,
    },
    mainGroupUUID
  );

  const newGroupUUID = pbxProject.addPbxGroup(
    [absoluteFilePath],
    'testGroup' + fileName,
    'testGroup' + fileName
  );
  objects.PBXGroup[mainGroupUUID].children.push({
    value: newGroupUUID,
    comment: fileName,
  });

  // pbxProject.removeSourceFile(
  //   absoluteFilePath,
  //   {
  //     target: mainTargetUUID,
  //   },
  //   mainGroupUUID
  // );
  // objects.PBXBuildFile[buildFileUUID] = {
  //   isa: 'PBXBuildFile',
  //   fileRef: newFileUUID,
  // };
  // objects.PBXBuildFile[buildFileUUID + '_comment'] = fileName;

  // objects.PBXFileReference[newFileUUID] = {
  //   isa: 'PBXFileReference',
  //   lastKnownFileType: 'sourcecode.swift',
  //   name: fileName,
  //   path: fileRelativeToIos,
  //   sourceTree: 'SOURCE_ROOT',
  // };
  // objects.PBXFileReference[newFileUUID + '_comment'] = fileName;

  // objects.PBXGroup[mainGroupUUID].children.push({
  //   value: newFileUUID,
  //   comment: fileName,
  // });

  // // Need to somehow get to the Sources UUID
  // const sourcesUUID = ((): string => {
  //   for (const pr in objects.PBXSourcesBuildPhase) {
  //     if (!pr.endsWith('_comment')) {
  //       return pr;
  //     }
  //     return 'INVALID_UUID';
  //   }
  // })();
  // objects.PBXSourcesBuildPhase[sourcesUUID].files.push({
  //   value: buildFileUUID,
  //   comment: fileName,
  // });

  fs.writeFileSync(pbxProject.filepath, pbxProject.writeSync());
}

function onRemoveSwiftFile(projectRoot: string, absoluteFilePath: string) {
  console.log('Need to remove the "' + path.basename(absoluteFilePath) + '" file');
  const pbxProject = getPbxproj(projectRoot);
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const mainTargetUUID = pbxProject.getFirstProject().firstProject.targets[0].value;

  pbxProject.removeSourceFile(
    absoluteFilePath,
    {
      target: mainTargetUUID,
    },
    mainGroupUUID
  );

  fs.writeFileSync(pbxProject.filepath, pbxProject.writeSync());
}

function addNewFile(projectRoot: string, absoluteFilePath: string, filesWatched?: Set<string>) {
  const { typesFilePath, moduleExportPath, moduleName, androidPath, iosFilePath } =
    typesAndLocalModulePaths(projectRoot, absoluteFilePath);
  if (absoluteFilePath.endsWith('.kt')) {
    fs.mkdirSync(path.dirname(androidPath), { recursive: true });
    fs.symlinkSync(absoluteFilePath, androidPath);
  } else if (absoluteFilePath.endsWith('.swift')) {
    addNewFileToXCodeProject(projectRoot, absoluteFilePath);
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
    const { typesFilePath, moduleExportPath, androidPath } = typesAndLocalModulePaths(
      projectRoot,
      absoluteFilePath
    );
    if (absoluteFilePath.endsWith('.kt')) {
      removeFileAndEmptyDirectories(androidPath);
    }
    if (absoluteFilePath.endsWith('.swift')) {
      onRemoveSwiftFile(projectRoot, absoluteFilePath);
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
