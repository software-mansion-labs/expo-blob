"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLocalModules = void 0;
const config_plugins_1 = require("expo/config-plugins");
const { createBuildGradlePropsConfigPlugin } = config_plugins_1.AndroidConfig.BuildProperties;
const { createBuildPodfilePropsConfigPlugin } = config_plugins_1.IOSConfig.BuildProperties;
const withLocalModules = (config, props) => {
    config = createBuildGradlePropsConfigPlugin([
        {
            propName: 'expo.localModules.enabled',
            propValueGetter: (conf) => (conf.experiments?.localModules === true).toString(),
        },
        {
            propName: 'expo.localModules.watchedDirs',
            propValueGetter: (conf) => {
                if (conf.experiments?.localModules !== true) {
                    return JSON.stringify({ watchedDirs: [] });
                }
                return JSON.stringify({ watchedDirs: conf.localModules?.watchedDirs ?? [] });
            },
        },
    ], 'withAndroidLocalModules')(config);
    config = createBuildPodfilePropsConfigPlugin([
        {
            propName: 'expo.localModules.enabled',
            propValueGetter: (conf) => (conf.experiments?.localModules === true).toString(),
        },
        {
            propName: 'expo.localModules.watchedDirs',
            propValueGetter: (conf) => {
                if (conf.experiments?.localModules !== true) {
                    return JSON.stringify({ watchedDirs: [] });
                }
                return JSON.stringify({ watchedDirs: conf.localModules?.watchedDirs ?? [] });
            },
        },
    ], 'withIosLocalModules')(config);
    return config;
};
exports.withLocalModules = withLocalModules;
exports.default = exports.withLocalModules;
//# sourceMappingURL=withLocalModules.js.map