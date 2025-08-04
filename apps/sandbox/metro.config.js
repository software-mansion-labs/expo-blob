// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const fs = require('fs');
const path = require('path');

console.log('in metro config');

const theFolderPath = path.resolve(__dirname, 'node_modules/.cache/virtual');
const thePath = path.resolve(__dirname, 'node_modules/.cache/virtual/LocalModules.js');
fs.mkdirSync(theFolderPath, {
  recursive: true,
});
fs.writeFileSync(thePath, '');

console.log(__dirname);

const localModulesExports = path.resolve(__dirname, './.expo/localModules/');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.kt')) {
    console.log('trying to resolve .kt module: ' + moduleName);
    const pathToExportFile = path.resolve(
      localModulesExports,
      moduleName.slice(0, -3).toString() + '.js'
    );
    return {
      filePath: pathToExportFile,
      type: 'sourceFile',
    };
  }

  const resolution = context.resolveRequest(context, moduleName, platform);
  return resolution;
};

module.exports = config;
