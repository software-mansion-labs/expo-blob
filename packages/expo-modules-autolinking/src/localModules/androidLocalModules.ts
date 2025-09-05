import fs from 'fs';
import path from 'path';

import { getAppRoot, getMirrorStateObject } from './localModules';

export async function generateSymlinksInDirectory(targetPath: string) {
  const mirrorJson = await getMirrorStateObject();
  const appRoot = await getAppRoot();

  for (const file of mirrorJson.files) {
    if (!file.endsWith('.kt')) {
      continue;
    }
    const symlinkPath = path.resolve(path.dirname(targetPath), path.relative(appRoot, file));
    if (fs.existsSync(symlinkPath)) {
      continue;
    }
    fs.mkdirSync(path.dirname(symlinkPath), { recursive: true });
    fs.symlinkSync(file, symlinkPath);
  }
}

export async function getAndroidLocalModulesClasses() {
  const mirrorJson = await getMirrorStateObject();

  return mirrorJson.kotlinClasses;
}
