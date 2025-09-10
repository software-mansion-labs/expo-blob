"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLocalModulesCommand = resolveLocalModulesCommand;
exports.prepareLocalModulesAndroidDirectory = prepareLocalModulesAndroidDirectory;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const autolinkingOptions_1 = require("./autolinkingOptions");
const androidLocalModules_1 = require("../localModules/androidLocalModules");
function resolveLocalModulesCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('resolveLocalModules'))
        .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
        .action(async (commandArguments) => {
        const platform = commandArguments.platform ?? 'android';
        if (platform !== 'android') {
            console.log('resolve local modules only supported for android.');
        }
        const localModules = await (0, androidLocalModules_1.getLocalModulesKotlinFilesPaths)();
        if (commandArguments.json) {
            console.log(JSON.stringify({
                modules: localModules,
            }));
        }
        else {
            console.log(require('util').inspect({
                modules: localModules,
            }, false, null, true));
        }
    });
}
function prepareLocalModulesAndroidDirectory(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('mirror-kotlin-local-modules mirrorPath')).action(async (p, commandArguments) => {
        const mirrorPath = commandArguments.args[0];
        if (!mirrorPath) {
            console.log('No mirror path provieded!');
            return;
        }
        if (!/.android./.test(mirrorPath)) {
            console.log('the mirror path is not inside any android directory!');
            return;
        }
        if (!path_1.default.isAbsolute(mirrorPath)) {
            console.log('Need to provide the absolute path to the local modules andorid directory!');
            return;
        }
        fs_1.default.rmSync(mirrorPath, { recursive: true, force: true });
        await (0, androidLocalModules_1.createSymlinksToKotlinFiles)(mirrorPath);
        await (0, androidLocalModules_1.generateLocalModulesListFile)(mirrorPath);
    });
}
//# sourceMappingURL=localModulesCommand.js.map