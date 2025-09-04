import fs from 'fs';
import path from 'path';

import { getMirrorStateObject, LocalModulesMirror } from './localModules';

export async function generateSymlinksInDirectory(targetPath: string) {
  const mirrorJson = await getMirrorStateObject();

  for (const file of mirrorJson.files) {
    if (!file.endsWith('.kt')) {
      continue;
    }
    if (fs.existsSync(path.resolve(path.dirname(targetPath), path.basename(file)))) {
      continue;
    }
    fs.symlinkSync(file, path.resolve(path.dirname(targetPath), path.basename(file)));
  }
}

export async function getAndroidLocalModulesClasses() {
  const mirrorJson = await getMirrorStateObject();

  return mirrorJson.kotlinClasses;
}
