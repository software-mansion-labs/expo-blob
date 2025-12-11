import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import Server from '@expo/metro/metro/Server';
import fs from 'fs';
import path from 'path';

import { Event, EventsQueue } from './generation.types';
import { ensureDotExpoProjectDirectoryInitialized } from '../start/project/dotExpo';

export interface ModuleGenerationArguments {
  projectRoot: string;
  metro: Server | null;
}

function findUpPackageJsonDirectory(
  cwd: string,
  directoryToPackage: Map<string, string>
): string | undefined {
  if (['.', path.sep].includes(cwd)) return undefined;
  if (directoryToPackage.has(cwd)) return directoryToPackage.get(cwd);

  const packageFound = fs.existsSync(path.resolve(cwd, './package.json'));
  if (packageFound) {
    directoryToPackage.set(cwd, cwd);
    return cwd;
  }
  const packageRoot = findUpPackageJsonDirectory(path.dirname(cwd), directoryToPackage);
  if (packageRoot) {
    directoryToPackage.set(cwd, packageRoot);
  }
  return packageRoot;
}
const nativeExtensions = ['.kt', '.swift'];

function isValidInlineModuleFileName(fileName: string): boolean {
  return nativeExtensions.includes(path.extname(fileName));
}

function getMirrorDirectories(projectRoot: string): {
  inlineModulesModulesPath: string;
  inlineModulesTypesPath: string;
} {
  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const inlineModulesPath = path.resolve(dotExpoDir, './inlineModules/');

  const inlineModulesModulesPath = path.resolve(inlineModulesPath, 'modules');
  const inlineModulesTypesPath = path.resolve(inlineModulesPath, 'types');

  return {
    inlineModulesModulesPath,
    inlineModulesTypesPath,
  };
}

async function createFreshMirrorDirectories(projectRoot: string): Promise<void> {
  const { inlineModulesModulesPath, inlineModulesTypesPath } = getMirrorDirectories(projectRoot);

  const rmPromises = [];
  if (fs.existsSync(inlineModulesModulesPath)) {
    rmPromises.push(fs.promises.rm(inlineModulesModulesPath, { recursive: true, force: true }));
  }
  if (fs.existsSync(inlineModulesTypesPath)) {
    rmPromises.push(fs.promises.rm(inlineModulesTypesPath, { recursive: true, force: true }));
  }
  await Promise.all(rmPromises);
  await Promise.all([
    fs.promises.mkdir(inlineModulesModulesPath, { recursive: true }),
    fs.promises.mkdir(inlineModulesTypesPath, { recursive: true }),
  ]);
}

function trimExtension(fileName: string): string {
  return fileName.substring(0, fileName.lastIndexOf('.'));
}

function typesAndModulePathsForFile(
  projectRoot: string,
  watchedDirRootAbolutePath: string,
  absoluteFilePath: string,
  directoryToPackage: Map<string, string>
): {
  moduleTypesFilePath: string;
  viewTypesFilePath: string;
  viewExportPath: string;
  moduleExportPath: string;
  moduleName: string;
} {
  const { inlineModulesModulesPath, inlineModulesTypesPath } = getMirrorDirectories(projectRoot);
  const fileName = path.basename(absoluteFilePath);
  const moduleName = trimExtension(fileName);

  const watchedDirProjectRoot = findUpPackageJsonDirectory(
    watchedDirRootAbolutePath,
    directoryToPackage
  );
  if (!watchedDirProjectRoot) {
    throw Error('Watched directory is not inside a project with package.json!');
  }
  const filePathRelativeToTSProjectRoot = path.relative(watchedDirProjectRoot, absoluteFilePath);
  const filePathRelativeToTSProjectRootWithoutExtension = trimExtension(
    filePathRelativeToTSProjectRoot
  );

  const moduleTypesFilePath = path.resolve(
    inlineModulesTypesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.module.d.ts'
  );
  const viewTypesFilePath = path.resolve(
    inlineModulesTypesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.view.d.ts'
  );
  const moduleExportPath = path.resolve(
    inlineModulesModulesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.module.js'
  );
  const viewExportPath = path.resolve(
    inlineModulesModulesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.view.js'
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
    const fileToCheck = `${fileWithoutExtension}${extension}`;
    if (filesWatched.has(fileToCheck)) {
      return true;
    }
  }
  return false;
}

export async function updateXCodeProject(projectRoot: string): Promise<void> {
  const pbxProject = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const mainTargetUUID = pbxProject.getFirstProject().firstProject.targets[0].value;
  const iosFolderPath = path.resolve(projectRoot, 'ios');

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
        path.relative(iosFolderPath, path.resolve(projectRoot, dir)) ===
        objects.PBXFileSystemSynchronizedRootGroup[key].path
      ) {
        return true;
      }
    }
    return false;
  };

  const swiftWatchedDirectories =
    getConfig(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
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
      path: path.relative(iosFolderPath, path.resolve(projectRoot, dir)),
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

  await fs.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}

function getWatchedDirAncestorAbsolutePath(
  projectRoot: string,
  filePathAbsolute: string
): string | null {
  const watchedDirectories =
    getConfig(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
  const realRoot = path.resolve(projectRoot);
  for (const dir of watchedDirectories) {
    const dirPathAbsolute = path.resolve(realRoot, dir);
    if (filePathAbsolute.startsWith(dirPathAbsolute)) {
      return dirPathAbsolute;
    }
  }
  return null;
}

async function onSourceFileCreated(
  projectRoot: string,
  watchedDirRootAbolutePath: string,
  absoluteFilePath: string,
  directoryToPackage: Map<string, string>,
  filesWatched?: Set<string>
): Promise<void> {
  const { moduleTypesFilePath, viewTypesFilePath, viewExportPath, moduleExportPath, moduleName } =
    typesAndModulePathsForFile(
      projectRoot,
      watchedDirRootAbolutePath,
      absoluteFilePath,
      directoryToPackage
    );

  if (filesWatched && fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
    filesWatched.add(absoluteFilePath);
    return;
  }
  if (filesWatched) {
    filesWatched.add(absoluteFilePath);
  }

  await Promise.all([
    fs.promises.mkdir(path.dirname(moduleExportPath), { recursive: true }),
    fs.promises.mkdir(path.dirname(moduleTypesFilePath), { recursive: true }),
  ]);

  await Promise.all([
    fs.promises.writeFile(
      viewExportPath,
      `import { requireNativeView } from 'expo';
export default requireNativeView("${moduleName}");`
    ),
    fs.promises.writeFile(
      moduleExportPath,
      `import { requireNativeModule } from 'expo';
export default requireNativeModule("${moduleName}");`
    ),
    fs.promises.writeFile(
      viewTypesFilePath,
      `import React from "react"
const _default: React.JSX.ElementType
export default _default`
    ),
    fs.promises.writeFile(
      moduleTypesFilePath,
      `const _default: any
export default _default`
    ),
  ]);
}

async function generateMirrorDirectories(
  projectRoot: string,
  filesWatched?: Set<string>,
  directoryToPackage: Map<string, string> = new Map<string, string>()
): Promise<void> {
  await createFreshMirrorDirectories(projectRoot);

  const generateExportsAndTypesForDirectory = async (
    absoluteDirPath: string,
    watchedDirRootAbolutePath: string
  ) => {
    for (const glob of excludePathsGlobs(projectRoot)) {
      if (path.matchesGlob(absoluteDirPath, glob)) {
        return;
      }
    }

    const dir = await fs.promises.opendir(absoluteDirPath);
    for await (const dirent of dir) {
      const absoluteDirentPath = path.resolve(absoluteDirPath, dirent.name);
      if (
        dirent.isFile() &&
        isValidInlineModuleFileName(dirent.name) &&
        absoluteDirentPath.startsWith(watchedDirRootAbolutePath)
      ) {
        onSourceFileCreated(
          projectRoot,
          watchedDirRootAbolutePath,
          absoluteDirentPath,
          directoryToPackage,
          filesWatched
        );
      } else if (dirent.isDirectory()) {
        await generateExportsAndTypesForDirectory(absoluteDirentPath, watchedDirRootAbolutePath);
      }
    }
  };

  const watchedDirectories =
    getConfig(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
  for (const watchedDirectory of watchedDirectories) {
    await generateExportsAndTypesForDirectory(
      path.resolve(projectRoot, watchedDirectory),
      await fs.promises.realpath(watchedDirectory)
    );
  }
}

const EXCLUDE_GLOBS = [
  '.expo/**/*',
  'node_modules/**/*',
  'android/**/*',
  'ios/**/*',
  'modules/**/*',
];

function excludePathsGlobs(projectRoot: string): string[] {
  return EXCLUDE_GLOBS.map((glob) => path.resolve(projectRoot, glob));
}

export async function startModuleGenerationAsync({
  projectRoot,
  metro,
}: ModuleGenerationArguments): Promise<void> {
  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const filesWatched = new Set<string>();
  const directoryToPackage: Map<string, string> = new Map<string, string>();

  const isFileExcluded = (absolutePath: string) => {
    for (const glob of excludePathsGlobs(projectRoot)) {
      if (path.matchesGlob(absolutePath, glob)) {
        return true;
      }
    }
    return false;
  };

  await createFreshMirrorDirectories(projectRoot);

  const removeFileAndEmptyDirectories = async (absoluteFilePath: string) => {
    await fs.promises.rm(absoluteFilePath);
    let dirNow: string = path.dirname(absoluteFilePath);
    while ((await fs.promises.readdir(dirNow)).length === 0 && dirNow !== dotExpoDir) {
      await fs.promises.rmdir(dirNow);
      dirNow = path.dirname(dirNow);
    }
  };

  const onSourceFileRemoved = (absoluteFilePath: string, watchedDirRootAbolutePath: string) => {
    const { moduleTypesFilePath, moduleExportPath, viewExportPath, viewTypesFilePath } =
      typesAndModulePathsForFile(
        projectRoot,
        watchedDirRootAbolutePath,
        absoluteFilePath,
        directoryToPackage
      );

    filesWatched.delete(absoluteFilePath);
    if (!fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
      removeFileAndEmptyDirectories(moduleTypesFilePath);
      removeFileAndEmptyDirectories(moduleExportPath);
      removeFileAndEmptyDirectories(viewExportPath);
      removeFileAndEmptyDirectories(viewTypesFilePath);
    }
  };

  const watcher = metro?.getBundler().getBundler().getWatcher();
  const eventTypes = ['add', 'delete', 'change'];

  const isWatchedFileEvent = (event: Event, watchedDirAncestor: string | null): boolean => {
    return (
      isValidInlineModuleFileName(path.basename(event.filePath)) &&
      !isFileExcluded(event.filePath) &&
      !!watchedDirAncestor
    );
  };

  const listener = async ({ eventsQueue }: { eventsQueue: EventsQueue }) => {
    for (const event of eventsQueue) {
      const watchedDirAncestor = getWatchedDirAncestorAbsolutePath(
        projectRoot,
        path.resolve(event.filePath)
      );
      if (
        eventTypes.includes(event.type) &&
        isWatchedFileEvent(event, watchedDirAncestor) &&
        !!watchedDirAncestor
      ) {
        const { filePath } = event;
        if (event.type === 'add') {
          onSourceFileCreated(
            projectRoot,
            watchedDirAncestor,
            filePath,
            directoryToPackage,
            filesWatched
          );
        } else if (event.type === 'delete') {
          onSourceFileRemoved(filePath, watchedDirAncestor);
        }
      }
    }
  };

  watcher?.addListener('change', listener);

  await generateMirrorDirectories(projectRoot, filesWatched, directoryToPackage);
}
