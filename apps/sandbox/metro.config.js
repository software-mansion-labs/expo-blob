// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const path = require('path');

const appDirPath = path.resolve(__dirname, './app');
const localModulesApp = path.resolve(__dirname, './.expo/localModules/./app');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.kt')) {
    const relativePathToOriginModule = path.relative(
      appDirPath,
      path.dirname(context.originModulePath)
    );

    const modulePath = path.resolve(
      localModulesApp,
      relativePathToOriginModule,
      moduleName.slice(0, -3) + '.js'
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
