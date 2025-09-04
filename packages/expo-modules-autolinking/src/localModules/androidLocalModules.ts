import fs from 'fs';
import path from 'path';
import { LocalModulesMirror } from '../platforms/apple/apple';

export function generateSymlinksInDirectory(targetPath: string, appRoot: string) {
  const mirrorJsonPath = path.resolve(appRoot, '.expo/localModules/mirror.json');
  const mirrorJson = JSON.parse(fs.readFileSync(mirrorJsonPath).toString()) as LocalModulesMirror;

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

export function getAndroidLocalModulesClasses(appRoot: string) {
  const mirrorJsonPath = path.resolve(appRoot, '.expo/localModules/mirror.json');
  const mirrorJson = JSON.parse(fs.readFileSync(mirrorJsonPath).toString()) as LocalModulesMirror;

  return mirrorJson.kotlinClasses;
}
