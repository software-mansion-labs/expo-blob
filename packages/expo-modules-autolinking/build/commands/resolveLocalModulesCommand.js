"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLocalModulesCommand = resolveLocalModulesCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const localModules_1 = require("../localModules/localModules");
function hasCoreFeatures(module) {
    return module.coreFeatures !== undefined;
}
/** Searches for available expo modules and resolves the results for given platform. */
function resolveLocalModulesCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('resolveLocalModules'))
        .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
        .action(async (commandArguments) => {
        const platform = commandArguments.platform ?? 'android';
        if (platform !== 'android') {
            console.log('resolve local modules only supported for android.');
        }
        const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
            ...commandArguments,
        });
        const localModules = await (0, localModules_1.getLocalModulesKotlinFilesPaths)();
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