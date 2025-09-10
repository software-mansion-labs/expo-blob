import fs from 'fs';
import path from 'path';

import { getAppRoot, getMirrorStateObject } from './localModules';

export async function getLocalModulesKotlinFilesPaths(): Promise<{ path: string }[]> {
  const mirror = await getMirrorStateObject();
  const ret: { path: string }[] = [];
  for (const file of mirror.files) {
    if (file && file.endsWith('.kt')) {
      ret.push({ path: file });
    }
  }
  return ret;
}

export async function createSymlinksToKotlinFiles(mirrorPath: string) {
  const localModulesObject = await getMirrorStateObject();
  const appRoot = await getAppRoot();

  for (const filePath of localModulesObject.files) {
    if (!filePath.endsWith('.kt')) {
      continue;
    }
    const filePathRelativeToRoot = path.relative(appRoot, filePath);
    const targetPath = path.resolve(mirrorPath, filePathRelativeToRoot);

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.symlinkSync(filePath, targetPath);
  }
}

export async function generateLocalModulesListFile(mirrorPath: string) {
  const localModulesObject = await getMirrorStateObject();
  const fileContent = `
package local.modules;

import java.util.Arrays;
import java.util.List;

import expo.modules.kotlin.ModulesProvider;
import expo.modules.kotlin.modules.Module;

public class ExpoLocalModulesList implements ModulesProvider {
    private static class LazyHolder {
        static final List<Class<? extends Module>> modulesList = Arrays.<Class<? extends Module>>asList(
          ${localModulesObject.kotlinClasses.map((moduleClass) => `      ${moduleClass}.class`).join(',\n')}
        );
    }

    @Override
    public List<Class<? extends Module>> getModulesList() {
        return local.modules.ExpoLocalModulesList.LazyHolder.modulesList;
    }
}
`;

  fs.writeFileSync(path.resolve(mirrorPath, 'ExpoLocalModulesList.java'), fileContent);
}
