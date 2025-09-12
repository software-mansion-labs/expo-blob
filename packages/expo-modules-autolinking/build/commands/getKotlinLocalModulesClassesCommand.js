"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKotlinLocalModulesClassesCommand = getKotlinLocalModulesClassesCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const localModules_1 = require("../localModules/localModules");
function getKotlinLocalModulesClassesCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('get-kotlin-local-modules-classes <watchedDirs>')).action(async (watchedDirsSerialized, commandArguments) => {
        const watchedDirs = JSON.parse(watchedDirsSerialized).watchedDirs;
        console.log(JSON.stringify({ kotlinClasses: (await (0, localModules_1.getMirrorStateObject)(watchedDirs)).kotlinClasses }));
    });
}
//# sourceMappingURL=getKotlinLocalModulesClassesCommand.js.map