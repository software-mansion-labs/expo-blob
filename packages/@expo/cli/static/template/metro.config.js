// Learn more https://docs.expo.io/guides/customizing-metro
import { getConfig } from '@expo/config';

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const expoConfig = getConfig();
if (expoConfig.exp?.experiments?.localModules === true) {
  const path = require('path');
  const localModulesModulesPath = path.resolve(__dirname, './.expo/localModules/modules');

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.endsWith('.module')) {
      const relativePathToOriginModule = path.relative(
        __dirname,
        path.dirname(context.originModulePath)
      );

      const modulePath = path.resolve(
        localModulesModulesPath,
        relativePathToOriginModule,
        moduleName.substring(0, moduleName.lastIndexOf('.')) + '.module.js'
      );

      return {
        filePath: modulePath,
        type: 'sourceFile',
      };
    } else if (moduleName.endsWith('.view')) {
      const relativePathToOriginModule = path.relative(
        __dirname,
        path.dirname(context.originModulePath)
      );

      const modulePath = path.resolve(
        localModulesModulesPath,
        relativePathToOriginModule,
        moduleName.substring(0, moduleName.lastIndexOf('.')) + '.view.js'
      );

      return {
        filePath: modulePath,
        type: 'sourceFile',
      };
    }

    const resolution = context.resolveRequest(context, moduleName, platform);
    return resolution;
  };
}

module.exports = config;
