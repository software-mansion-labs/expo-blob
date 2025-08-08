// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const path = require('path');
const localModulesPath = path.resolve(__dirname, './.expo/localModules');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.nativeModule')) {
    const relativePathToOriginModule = path.relative(
      __dirname,
      path.dirname(context.originModulePath)
    );

    const modulePath = path.resolve(
      localModulesPath,
      relativePathToOriginModule,
      moduleName.substring(0, moduleName.lastIndexOf('.nativeModule')) + '.js'
    );

    return {
      filePath: modulePath,
      type: 'sourceFile',
    };
  }

  const resolution = context.resolveRequest(context, moduleName, platform);
  return resolution;
};

module.exports = config;
