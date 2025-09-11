"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mirrorKotlinLocalModulesCommand = mirrorKotlinLocalModulesCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const autolinkingOptions_1 = require("./autolinkingOptions");
const androidLocalModules_1 = require("../localModules/androidLocalModules");
function mirrorKotlinLocalModulesCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('mirror-kotlin-local-modules <mirrorPath> <watchedDirsSerialized>')).action(async (mirrorPath, watchedDirsSerialized, commandArguments) => {
        const watchedDirs = JSON.parse(watchedDirsSerialized).watchedDirs;
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
        await (0, androidLocalModules_1.createSymlinksToKotlinFiles)(mirrorPath, watchedDirs);
        await (0, androidLocalModules_1.generateLocalModulesListFile)(mirrorPath, watchedDirs);
    });
}
//# sourceMappingURL=localModulesCommand.js.map