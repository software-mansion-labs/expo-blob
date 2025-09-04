import path from 'path';
import fs from 'fs';

export type LocalModulesMirror = {
  files: string[];
  swiftModuleClassNames: string[];
  kotlinClasses: string[];
};

const mirrorStateFileName = 'mirror.json';

export function getMirroStateObject(projectRoot: string): LocalModulesMirror {
  const localModulesPath = path.resolve(projectRoot, './.expo/localModules/');
  const mirrorFilePath = path.resolve(localModulesPath, mirrorStateFileName);

  return JSON.parse(fs.readFileSync(mirrorFilePath).toString()) as LocalModulesMirror;
}
