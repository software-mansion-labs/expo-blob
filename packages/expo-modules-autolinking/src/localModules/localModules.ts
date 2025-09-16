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
  const result = await findUp('package.json', { cwd });
  if (!result) {
    throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
  }
  return result;
};

export async function localModulesEnabled(): Promise<boolean> {
  const appJsonPath = path.resolve(path.dirname(await findPackageJsonPathAsync()), 'app.json');
  const obj = JSON.parse(fs.readFileSync(appJsonPath).toString());
  return (
    JSON.parse(fs.readFileSync(appJsonPath).toString())?.expo?.experiments?.localModules === true
  );
}

export async function getAppRoot(): Promise<string> {
  return path.dirname(await findPackageJsonPathAsync());
}

function trimExtension(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf('.'));
}

function getKotlinFileNameWithItsPackage(absoluteFilePath: string): string {
  const pacakgeRegex = /^package\s+/;
  const lines = fs.readFileSync(absoluteFilePath).toString().split('\n');
  const packageLine = lines.findIndex((line) => pacakgeRegex.test(line));
  if (packageLine < 0) {
    return '';
  }
  const packageName = lines[packageLine].substring('package '.length);
  return packageName + '.' + trimExtension(path.basename(absoluteFilePath));
}

function getSwiftModuleClassName(absoluteFilePath: string): string {
  return trimExtension(path.basename(absoluteFilePath));
}

export async function getMirrorStateObject(watchedDirs: string[]): Promise<LocalModulesMirror> {
  const appRoot = await getAppRoot();
  const localModulesMirror: LocalModulesMirror = {
    kotlinClasses: [],
    swiftModuleClassNames: [],
    files: [],
  };

  const recursivelyScanDirectory = async (absoluteDirPath: string) => {
    const dir = fs.opendirSync(absoluteDirPath);
    for await (const dirent of dir) {
      const absoluteDirentPath = path.resolve(absoluteDirPath, dirent.name);
      if (dirent.isDirectory()) {
        await recursivelyScanDirectory(absoluteDirentPath);
      }
      if (!dirent.isFile()) {
        continue;
      }

      if (/\.(kt)$/.test(dirent.name)) {
        const kotlinFileWithPackage = getKotlinFileNameWithItsPackage(absoluteDirentPath);
        localModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
        localModulesMirror.files.push(absoluteDirentPath);
      } else if (/\.(swift)$/.test(dirent.name)) {
        const swiftClassName = getSwiftModuleClassName(absoluteDirentPath);
        localModulesMirror.swiftModuleClassNames.push(swiftClassName);
        localModulesMirror.files.push(absoluteDirentPath);
      }
    }
  };

  for (const dir of watchedDirs ?? []) {
    await recursivelyScanDirectory(path.resolve(appRoot, dir));
  }
  return localModulesMirror;
}
