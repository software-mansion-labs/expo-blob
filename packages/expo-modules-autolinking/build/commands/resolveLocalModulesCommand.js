"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLocalModulesCommand = resolveLocalModulesCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const androidLocalModules_1 = require("../localModules/androidLocalModules");
/** Searches for available expo modules and resolves the results for given platform. */
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
//# sourceMappingURL=resolveLocalModulesCommand.js.map