// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const path = require('path');
const fs = require('fs');

console.log('in metro config');

const theFolderPath = path.resolve(__dirname, 'node_modules/.cache/virtual');
const thePath = path.resolve(__dirname, 'node_modules/.cache/virtual/LocalModules.js');
fs.mkdirSync(theFolderPath, {
  recursive: true,
});
fs.writeFileSync(thePath, '');

// config.watchFolders = [__dirname, theFolderPath];
// config.resetCache = true;

const appendModuleToTheFile = (moduleName) => {
  fs.writeFileSync(
    thePath,
    "import { requireNativeModule } from 'expo';\n\
    import * as React from 'react';\n\
    export const " +
      moduleName +
      " = requireNativeModule('" +
      moduleName +
      "');\n"
  );
  return thePath;
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.kt')) {
    console.log('trying to resolve .kt module');
    const pathToNewFile = appendModuleToTheFile(moduleName.slice(0, -3).toString());
    return {
      filePath: pathToNewFile,
      type: 'sourceFile',
    };
  }

  const resolution = context.resolveRequest(context, moduleName, platform);
  return resolution;
};

module.exports = config;
