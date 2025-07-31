/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, { isCSSEnabled: true });
const monorepoRoot = path.join(__dirname, '../..');

const theFolderPath = path.resolve(__dirname, 'node_modules/.cache/virtual');
const thePath = path.resolve(__dirname, 'node_modules/.cache/virtual/LocalModules.js');

fs.mkdirSync(theFolderPath, {
  recursive: true,
});
fs.writeFileSync(thePath, '');

// Minimize the "watched" folders that Metro crawls through to speed up Metro in big monorepos.
// Note, omitting folders disables Metro from resolving files within these folders
// This also happens when symlinks falls within these folders, but the real location doesn't.
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
  theFolderPath,
];

config.resetCache = true;

const appendModuleToTheFile = (moduleName) => {
  let fileContent = fs.existsSync(thePath) ? fs.readFileSync(thePath, 'utf8') : '';

  if (!fileContent) {
    fileContent = "import { requireNativeModule } from 'expo';\nimport * as React from 'react';\n";
  }

  const moduleExists = fileContent.includes(
    `export const ${moduleName} = requireNativeModule('${moduleName}')`
  );

  if (!moduleExists) {
    fileContent += `export const ${moduleName} = requireNativeModule('${moduleName}');\n`;
  }

  fs.writeFileSync(thePath, fileContent);
  return thePath;
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.kt') || moduleName.endsWith('.swift')) {
    const sliceLength = moduleName.endsWith('.kt') ? 3 : 6;
    const pathToNewFile = appendModuleToTheFile(moduleName.slice(0, -sliceLength).toString());
    return {
      filePath: pathToNewFile,
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

config.resolver.blockList = [
  /\/expo-router\/node_modules\/@react-navigation/,
  /node_modules\/@react-navigation\/native-stack\/node_modules\/@react-navigation\//,
  /node_modules\/pretty-format\/node_modules\/react-is/,
];

module.exports = config;
