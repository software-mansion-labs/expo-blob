import findUp from 'find-up';
import fs from 'fs';
import path from 'path';

export type LocalModulesMirror = {
  files: string[];
  swiftModuleClassNames: string[];
  kotlinClasses: string[];
};

// copied from autolinkingOptions, maybe export it somewhere
const findPackageJsonPathAsync = async (): Promise<string> => {
  const cwd = process.cwd();
  fs.writeFileSync(
    '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
    '!!! cwd: ' + cwd + '\n',
    { flag: 'a+' }
  );
  const result = await findUp('package.json', { cwd });
  if (!result) {
    throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
  }
  return result;
};

export async function localModulesMirrorExists(): Promise<boolean> {
  const appRoot = await getAppRoot();
  const localModulesPath = path.resolve(appRoot, './.expo/localModules/');
  const mirrorFilePath = path.resolve(localModulesPath, mirrorStateFileName);
  return fs.existsSync(mirrorFilePath);
}

export async function localModulesEnabled(): Promise<boolean> {
  const appJsonPath = path.resolve(path.dirname(await findPackageJsonPathAsync()), 'app.json');
  const obj = JSON.parse(fs.readFileSync(appJsonPath).toString());
  fs.writeFileSync(
    '/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt',
    // `!!! ${JSON.stringify(obj?.expo)} ${JSON.stringify(obj?.expo?.experiments)} ${obj?.expo?.experiments?.localModules} \n`,
    `${JSON.parse(fs.readFileSync(appJsonPath).toString())?.expo?.experiments?.localModules === true}`,
    { flag: 'a+' }
  );
  return (
    JSON.parse(fs.readFileSync(appJsonPath).toString())?.expo?.experiments?.localModules === true
  );
}

export async function getAppRoot(): Promise<string> {
  return path.dirname(await findPackageJsonPathAsync());
}

const mirrorStateFileName = 'mirror.json';

export async function getMirrorStateObject(): Promise<LocalModulesMirror> {
  const appRoot = await getAppRoot();
  const localModulesPath = path.resolve(appRoot, './.expo/localModules/');
  const mirrorFilePath = path.resolve(localModulesPath, mirrorStateFileName);

  return JSON.parse(fs.readFileSync(mirrorFilePath).toString()) as LocalModulesMirror;
}
