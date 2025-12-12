import { it, expect, describe } from '@jest/globals';
import * as path from 'path';

import {
  isValidInlineModuleFileName,
  trimExtension,
  getProjectExcludePathsGlobs,
  getMirrorDirectoriesPaths,
  isFilePathExcluded,
  findUpPackageJsonDirectoryCached,
  typesAndModulePathsForFile,
} from '../src/generation';

describe('extensions, names, paths', () => {
  it('valid inline module file name', () => {
    expect(isValidInlineModuleFileName('TestModule.kt')).toBe(true);
    expect(isValidInlineModuleFileName('TestModule.swift')).toBe(true);
    expect(isValidInlineModuleFileName('A.kt')).toBe(true);
    expect(isValidInlineModuleFileName('A.swift')).toBe(true);
    expect(isValidInlineModuleFileName('TestModule.k')).toBe(false);
    expect(isValidInlineModuleFileName('TestModule.js')).toBe(false);
    expect(isValidInlineModuleFileName('swift.')).toBe(false);
  });
  it('trim extension', () => {
    expect(trimExtension('TestModule.kt')).toBe('TestModule');
    expect(trimExtension('A.swift')).toBe('A');
    expect(trimExtension('module.js')).toBe('module');
    expect(trimExtension('module')).toBe('module');
    expect(trimExtension('module.test.ts')).toBe('module.test');
  });
  it('excluded files', () => {
    const projectRoot = '/Projects/project1';
    const excludePathsGlobs = getProjectExcludePathsGlobs(projectRoot);
    const isFileExcluded = (filePath: string) => isFilePathExcluded(filePath, excludePathsGlobs);
    expect(isFileExcluded('/Projects/project1/android/app/src/Module.kt')).toBe(true);
    expect(isFileExcluded('/Projects/project1/ios/app/Module.swift')).toBe(true);
    expect(isFileExcluded('/Projects/project1/.expo/Module.kt')).toBe(true);
    expect(isFileExcluded('/Projects/project1/Module.swift')).toBe(true);
    expect(isFileExcluded('/Projects/project1/node_modules/module/Module.kt')).toBe(true);
    expect(isFileExcluded('/Projects/project1/modules/module/Module.swift')).toBe(true);

    expect(isFileExcluded('/Projects/project1/app/Module.swift')).toBe(false);
    expect(isFileExcluded('/Projects/project1/src/something/Module.swift')).toBe(false);
    expect(isFileExcluded('/Projects/project1/weirdFolder/Module.swift')).toBe(false);
  });
  it('mirror directories paths', () => {
    const dotExpoDir = '/project/.expo';
    expect(getMirrorDirectoriesPaths(dotExpoDir)).toEqual({
      inlineModulesModulesPath: '/project/.expo/inlineModules/modules',
      inlineModulesTypesPath: '/project/.expo/inlineModules/types',
    });
  });
  it('types and modules mirror file paths', () => {
    const projectRoot = path.resolve(__dirname, './testProjectStructure');
    const dotExpoDir = path.resolve(projectRoot, '.expo');
    const watchedDirAncestor = path.resolve(projectRoot, 'app');
    const directoryToPackage = new Map<string, string>([
      [projectRoot, projectRoot],
      [watchedDirAncestor, projectRoot],
    ]);
    const filePath = path.resolve(projectRoot, 'app/SimpleModule.swift');

    expect(
      typesAndModulePathsForFile(dotExpoDir, watchedDirAncestor, filePath, directoryToPackage)
    ).toEqual({
      moduleTypesFilePath: path.resolve(
        dotExpoDir,
        'inlineModules/types/app/SimpleModule.module.d.ts'
      ),
      viewTypesFilePath: path.resolve(dotExpoDir, 'inlineModules/types/app/SimpleModule.view.d.ts'),
      viewExportPath: path.resolve(dotExpoDir, 'inlineModules/modules/app/SimpleModule.view.js'),
      moduleExportPath: path.resolve(
        dotExpoDir,
        'inlineModules/modules/app/SimpleModule.module.js'
      ),
      moduleName: 'SimpleModule',
    });
  });
});

describe('find up package json', () => {
  const testProjectDirectory = path.resolve(__dirname, './testProjectStructure');
  const nonexistentPath = path.resolve(testProjectDirectory, './this/path/does/not/exist');
  const pathToPackage = path.resolve(testProjectDirectory, './somePackage/folder/anotherFolder/');
  it('use the cache if possible', async () => {
    expect(
      findUpPackageJsonDirectoryCached(
        nonexistentPath,
        new Map([[nonexistentPath, nonexistentPath]])
      )
    ).toEqual(nonexistentPath);

    expect(
      findUpPackageJsonDirectoryCached(nonexistentPath, new Map([[nonexistentPath, pathToPackage]]))
    ).toEqual(pathToPackage);
  });
});

describe('file system operations', () => {});
