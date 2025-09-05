import { getConfig } from '@expo/config';
import { getPbxproj } from '@expo/config-plugins/build/ios/utils/Xcodeproj';
import Server from '@expo/metro/metro/Server';
import type MetroServer from '@expo/metro/metro/Server';
import fs from 'fs';
import path from 'path';

import { ensureDotExpoProjectDirectoryInitialized } from '../start/project/dotExpo';
import { getRouterDirectoryModuleIdWithManifest } from '../start/server/metro/router';
import { findUpProjectRootOrAssert } from '../utils/findUp';

export interface ModuleGenerationArguments {
  projectRoot: string;
  metro: Server | null;
}

const nativeExtensions = ['.kt', '.swift'];
const swiftWatchedDirectories = ['app', 'src'];
const mirrorStateFileName = 'mirror.json';

export function getAppRoot(): string {
  return path.dirname(findPackageJsonPathAsync());
}

const findPackageJsonPathAsync = (): string => {
  const cwd = process.cwd();
  fs.writeFileSync(
    '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
    '!!! cwd: ' + cwd + '\n',
    { flag: 'a+' }
  );
  const result = findUpProjectRootOrAssert(cwd);
  fs.writeFileSync(
    '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
    '!!! result: ' + result + '\n',
    { flag: 'a+' }
  );
  return path.resolve(result, 'package.json');
};

export function localModulesEnabled(): boolean {
  const appJsonPath = path.resolve(path.dirname(findPackageJsonPathAsync()), 'app.json');
  return (
    JSON.parse(fs.readFileSync(appJsonPath).toString())?.expo?.experiments?.localModules === true
  );
}

function mirrorDirectories(projectRoot: string): {
  dotExpoDir: string;
  localModulesPath: string;
  localModulesModulesPath: string;
  localModulesTypesPath: string;
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
  const localModulesModulesPath = path.resolve(localModulesPath, 'modules');
  const localModulesTypesPath = path.resolve(localModulesPath, 'types');

  return {
    dotExpoDir,
    localModulesPath,
    localModulesModulesPath,
    localModulesTypesPath,
    androidLocalModulesPath,
    iosPath,
    iosLocalModulesPath,
    xcodeProjPath,
  };
}

function createFreshMirrorDirectories(projectRoot: string) {
  const {
    localModulesModulesPath,
    localModulesTypesPath,
    androidLocalModulesPath,
    iosLocalModulesPath,
  } = mirrorDirectories(projectRoot);

  // make sure the directories exist so we can remove them.
  fs.mkdirSync(localModulesModulesPath, { recursive: true });
  fs.mkdirSync(localModulesTypesPath, { recursive: true });
  fs.mkdirSync(androidLocalModulesPath, { recursive: true });
  fs.mkdirSync(iosLocalModulesPath, { recursive: true });

  fs.rmSync(localModulesModulesPath, { recursive: true });
  fs.rmSync(localModulesTypesPath, { recursive: true });
  fs.rmSync(androidLocalModulesPath, { recursive: true });
  fs.rmSync(iosLocalModulesPath, { recursive: true });

  fs.mkdirSync(localModulesModulesPath, { recursive: true });
  fs.mkdirSync(localModulesTypesPath, { recursive: true });
  fs.mkdirSync(androidLocalModulesPath, { recursive: true });
  fs.mkdirSync(iosLocalModulesPath, { recursive: true });
}

function trimExtension(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf('.'));
}

function typesAndLocalModulePaths(projectRoot: string, absoluteFilePath: string) {
  const {
    localModulesModulesPath,
    localModulesTypesPath,
    androidLocalModulesPath,
    iosLocalModulesPath,
  } = mirrorDirectories(projectRoot);
  const splitPath = absoluteFilePath.toString().split('/') ?? ['EmptyModule.kt'];
  const justFileName = splitPath?.at(-1) ?? 'EmptyModule.kt';
  const moduleName = trimExtension(justFileName);

  const filePathRelativeToRoot = path.relative(projectRoot, absoluteFilePath);
  const moduleTypesFilePath = path.resolve(
    localModulesTypesPath,
    trimExtension(filePathRelativeToRoot) + '.nativeModule.d.ts'
  );
  const viewTypesFilePath = path.resolve(
    localModulesTypesPath,
    trimExtension(filePathRelativeToRoot) + '.nativeView.d.ts'
  );
  const viewExportPath = path.resolve(
    localModulesModulesPath,
    trimExtension(filePathRelativeToRoot) + '.native.view.js'
  );
  const moduleExportPath = path.resolve(
    localModulesModulesPath,
    trimExtension(filePathRelativeToRoot) + '.js'
  );
  const androidPath = path.resolve(androidLocalModulesPath, filePathRelativeToRoot);
  return {
    moduleTypesFilePath,
    viewTypesFilePath,
    viewExportPath,
    moduleExportPath,
    moduleName,
    androidPath,
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

    objects.PBXFileSystemSynchronizedRootGroup[newUUID] = {
      isa: 'PBXFileSystemSynchronizedRootGroup',
      explicitFileTypes: {},
      explicitFolders: [],
      name: dir,
      path: path.relative('./', path.resolve('../', dir)),
      sourceTree: 'SOURCE_ROOT',
    };

    //@ts-ignore
    objects.PBXFileSystemSynchronizedRootGroup[newUUID + '_comment'] = dir;

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

export type LocalModulesMirrorSerialized = {
  files: string[];
  swiftModuleClassNames: string[];
  kotlinClasses: string[];
};

export type LocalModulesMirror = {
  files: Set<string>;
  // swiftModuleClassNames: Set<string>;
  // kotlinClasses: Set<string>;
};

// export function getMirroStateObject(projectRoot: string): LocalModulesMirror {
//   const { localModulesPath } = mirrorDirectories(projectRoot);
//   const mirrorFilePath = path.resolve(localModulesPath, mirrorStateFileName);

//   const localModulesObjectSerialized = JSON.parse(
//     fs.readFileSync(mirrorFilePath).toString()
//   ) as LocalModulesMirrorSerialized;

//   const localModulesObject: LocalModulesMirror = {
//     files: new Set<string>(),
//     kotlinClasses: new Set<string>(),
//     swiftModuleClassNames: new Set<string>(),
//   };

//   return localModulesObject;
// }

function getKotlinFileNameWithItsPackage(file: string): string {
  const pacakgeRegex = /^package\s+/;
  const lines = fs.readFileSync(file).toString().split('\n');
  const packageLine = lines.findIndex((line) => pacakgeRegex.test(line));
  if (packageLine < 0) {
    return '';
  }
  const packageName = lines[packageLine].substring('package '.length);
  console.log(packageName);
  return packageName + '.' + trimExtension(path.basename(file));
}

function saveMirrorStateObject(projectRoot: string, localModulesMirror: LocalModulesMirror) {
  const { localModulesPath } = mirrorDirectories(projectRoot);
  const mirrorFilePath = path.resolve(localModulesPath, mirrorStateFileName);

  console.log('saving the mirror object');

  const filesArray = Array.from(localModulesMirror.files);
  const localModulesMirrorSerialized: LocalModulesMirrorSerialized = {
    files: filesArray,
    kotlinClasses: filesArray
      .filter((file) => file.endsWith('.kt'))
      // .map((file) => 'local.modules.' + path.basename(file).slice(0, -'.kt'.length).toString()),
      .map((file) => getKotlinFileNameWithItsPackage(file)),
    swiftModuleClassNames: filesArray
      .filter((file) => file.endsWith('.swift'))
      .map((file) => path.basename(file).slice(0, -'.swift'.length).toString()),
  };

  fs.writeFileSync(mirrorFilePath, JSON.stringify(localModulesMirrorSerialized));
}

function addNewFile(
  projectRoot: string,
  absoluteFilePath: string,
  mirrorStateObject: LocalModulesMirror = {
    files: new Set<string>(),
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
  } = typesAndLocalModulePaths(projectRoot, absoluteFilePath);

  mirrorStateObject.files.add(absoluteFilePath);

  if (absoluteFilePath.endsWith('.kt')) {
    fs.mkdirSync(path.dirname(androidPath), { recursive: true });
    fs.symlinkSync(absoluteFilePath, androidPath);
    // mirrorStateObject.kotlinClasses.push('local.modules.' + moduleName);
  } else if (
    absoluteFilePath.endsWith('.swift') &&
    swiftFileWatched(projectRoot, absoluteFilePath)
  ) {
    // we no longer do that
    // fs.mkdirSync(path.dirname(iosFilePath), { recursive: true });
    // fs.symlinkSync(absoluteFilePath, iosFilePath);
    // mirrorStateObject.swiftModuleClassNames.push(moduleName);
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
export default requireNativeView("${moduleName}");`
  );

  fs.writeFileSync(
    moduleExportPath,
    `import { requireNativeModule } from 'expo';
export default requireNativeModule("${moduleName}");`
  );

  // fs.writeFile(newTypesFilePath, `declare module "*/${justFileName}" {}`);
  fs.writeFileSync(moduleTypesFilePath, 'const _default: any\nexport default _default');
  fs.writeFileSync(viewTypesFilePath, 'const _default: any\nexport default _default');
  console.log('asynchronously added file', moduleTypesFilePath, 'with module name', moduleName);
}

export async function generateMirrorDirectoriesAndUpdateXCodeProject(
  projectRoot: string,
  filesWatched?: Set<string>,
  mirrorStateObject: LocalModulesMirror = {
    files: new Set<string>(),
  }
) {
  console.log('generate mirror directories and update xcode proejct');
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
  const { exp } = getConfig(projectRoot);
  const filesWatched = new Set<string>();

  console.log('inside async start metro..');
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

  const onRemoveAppFile = (absoluteFilePath: string, mirrorStateObject: LocalModulesMirror) => {
    const { moduleTypesFilePath, moduleExportPath, androidPath } = typesAndLocalModulePaths(
      projectRoot,
      absoluteFilePath
    );
    if (mirrorStateObject.files.has(absoluteFilePath)) {
      mirrorStateObject.files.delete(absoluteFilePath);
    }
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
    mirrorStateObject = {
      files: new Set<string>(),
    },
  }: {
    metro: MetroServer | null;
    projectRoot: string;
    eventTypes?: string[];
    mirrorStateObject?: LocalModulesMirror;
  }) => {
    const watcher = metro?.getBundler().getBundler().getWatcher();

    console.log('before listener');
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
      console.log('listener');
      for (const event of eventsQueue) {
        console.log(event.type);
        if (
          eventTypes.includes(event.type) &&
          event.metadata?.type !== 'd' &&
          !/node_modules/.test(event.filePath) &&
          /\.(kt|swift)$/.test(event.filePath) &&
          !fileExcluded(event.filePath)
        ) {
          const { filePath } = event;
          console.log('watcher');
          if (event.type === 'add') {
            addNewFile(projectRoot, filePath, mirrorStateObject, filesWatched);
            console.log('add' + event.filePath);
          } else if (event.type === 'delete') {
            console.log('delete ' + event.filePath);
            await onRemoveAppFile(filePath, mirrorStateObject);
          }
          saveMirrorStateObject(projectRoot, mirrorStateObject);
        }
      }
    };

    watcher?.addListener('change', listener);
    // watcher?.addListener('add', listener);
    // watcher?.addListener('remove', listener);

    await generateMirrorDirectoriesAndUpdateXCodeProject(
      projectRoot,
      filesWatched,
      mirrorStateObject
    );
    console.log('end123');
  };

  console.log('before metro watch');
  metroWatchKotlinAndSwiftFiles({
    projectRoot,
    metro,
    eventTypes: ['add', 'delete', 'change'],
  });
}
