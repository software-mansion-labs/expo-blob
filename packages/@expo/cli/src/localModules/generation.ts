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

export function getAppRoot(): string {
  return path.dirname(findPackageJsonPathAsync());
}

const findPackageJsonPathAsync = (): string => {
  const cwd = process.cwd();
  const result = findUpProjectRootOrAssert(cwd);
  return path.resolve(result, 'package.json');
};

export function localModulesEnabled(): boolean {
  const appJsonPath = path.resolve(path.dirname(findPackageJsonPathAsync()), 'app.json');
  return (
    JSON.parse(fs.readFileSync(appJsonPath).toString())?.expo?.experiments?.localModules === true
  );
}

function mirrorDirectories(projectRoot: string): {
  localModulesModulesPath: string;
  localModulesTypesPath: string;
} {
  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const localModulesPath = path.resolve(dotExpoDir, './localModules/');

  const localModulesModulesPath = path.resolve(localModulesPath, 'modules');
  const localModulesTypesPath = path.resolve(localModulesPath, 'types');

  return {
    localModulesModulesPath,
    localModulesTypesPath,
  };
}

function createFreshMirrorDirectories(projectRoot: string) {
  const { localModulesModulesPath, localModulesTypesPath } = mirrorDirectories(projectRoot);

  // make sure the directories exist so we can remove them.
  fs.mkdirSync(localModulesModulesPath, { recursive: true });
  fs.mkdirSync(localModulesTypesPath, { recursive: true });

  fs.rmSync(localModulesModulesPath, { recursive: true });
  fs.rmSync(localModulesTypesPath, { recursive: true });

  fs.mkdirSync(localModulesModulesPath, { recursive: true });
  fs.mkdirSync(localModulesTypesPath, { recursive: true });
}

function trimExtension(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf('.'));
}

function typesAndLocalModulePaths(projectRoot: string, absoluteFilePath: string) {
  const { localModulesModulesPath, localModulesTypesPath } = mirrorDirectories(projectRoot);
  const splitPath = absoluteFilePath.toString().split('/') ?? ['EmptyModule.kt'];
  const justFileName = splitPath?.at(-1) ?? 'EmptyModule.kt';
  const moduleName = trimExtension(justFileName);

  const filePathRelativeToRoot = path.relative(projectRoot, absoluteFilePath);
  const moduleTypesFilePath = path.resolve(
    localModulesTypesPath,
    trimExtension(filePathRelativeToRoot) + '.module.d.ts'
  );
  const viewTypesFilePath = path.resolve(
    localModulesTypesPath,
    trimExtension(filePathRelativeToRoot) + '.view.d.ts'
  );
  const viewExportPath = path.resolve(
    localModulesModulesPath,
    trimExtension(filePathRelativeToRoot) + '.view.js'
  );
  const moduleExportPath = path.resolve(
    localModulesModulesPath,
    trimExtension(filePathRelativeToRoot) + '.module.js'
  );
  return {
    moduleTypesFilePath,
    viewTypesFilePath,
    viewExportPath,
    moduleExportPath,
    moduleName,
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

export function updateXCodeProject(projectRoot: string) {
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

  const swiftWatchedDirectories = getConfig(projectRoot).exp.localModules?.watchedDirs ?? [];
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

function fileSupposedToBeWatched(projectRoot: string, filePathAbsolute: string): boolean {
  const watchedDirs = getConfig(projectRoot).exp.localModules?.watchedDirs ?? [];
  const realRoot = fs.realpathSync(projectRoot);
  for (const dir of watchedDirs) {
    const dirPathAbsolute = path.resolve(realRoot, dir);
    if (filePathAbsolute.startsWith(dirPathAbsolute)) {
      return true;
    }
  }
  return false;
}

function addNewFile(projectRoot: string, absoluteFilePath: string, filesWatched?: Set<string>) {
  const { moduleTypesFilePath, viewTypesFilePath, viewExportPath, moduleExportPath, moduleName } =
    typesAndLocalModulePaths(projectRoot, absoluteFilePath);

  if (filesWatched && fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
    filesWatched.add(absoluteFilePath);
    return;
  }
  if (filesWatched) {
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

  fs.writeFileSync(moduleTypesFilePath, 'const _default: any\nexport default _default');
  fs.writeFileSync(viewTypesFilePath, 'const _default: any\nexport default _default');
}

async function generateMirrorDirectories(projectRoot: string, filesWatched?: Set<string>) {
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
      if (
        dirent.isFile() &&
        /\.(kt|swift)$/.test(dirent.name) &&
        fileSupposedToBeWatched(projectRoot, absoluteDirentPath)
      ) {
        addNewFile(projectRoot, absoluteDirentPath, filesWatched);
      } else if (dirent.isDirectory()) {
        await generateExportsAndTypesForDirectory(absoluteDirentPath);
      }
    }
  };
  await generateExportsAndTypesForDirectory(projectRoot);
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
    if (fs.lstatSync(absoluteFilePath).isSymbolicLink()) {
      fs.unlinkSync(absoluteFilePath);
    } else {
      fs.rmSync(absoluteFilePath);
    }
    let dirNow: string = path.dirname(absoluteFilePath);
    while (fs.readdirSync(dirNow).length === 0 && dirNow !== dotExpoDir) {
      fs.rmdirSync(dirNow);
      dirNow = path.dirname(dirNow);
    }
  };

  const onRemoveAppFile = (absoluteFilePath: string) => {
    const { moduleTypesFilePath, moduleExportPath, viewExportPath, viewTypesFilePath } =
      typesAndLocalModulePaths(projectRoot, absoluteFilePath);

    filesWatched.delete(absoluteFilePath);
    if (!fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
      removeFileAndEmptyDirectories(moduleTypesFilePath);
      removeFileAndEmptyDirectories(moduleExportPath);
      removeFileAndEmptyDirectories(viewExportPath);
      removeFileAndEmptyDirectories(viewTypesFilePath);
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
          !fileExcluded(event.filePath) &&
          fileSupposedToBeWatched(projectRoot, event.filePath)
        ) {
          const { filePath } = event;
          if (event.type === 'add') {
            addNewFile(projectRoot, filePath, filesWatched);
          } else if (event.type === 'delete') {
            await onRemoveAppFile(filePath);
          }
        }
      }
    };

    watcher?.addListener('change', listener);

    await generateMirrorDirectories(projectRoot, filesWatched);
  };

  metroWatchKotlinAndSwiftFiles({
    projectRoot,
    metro,
    eventTypes: ['add', 'delete', 'change'],
  });
}
