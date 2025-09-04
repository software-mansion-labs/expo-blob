"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalModulesClassNames = getLocalModulesClassNames;
const localModules_1 = require("./localModules");
async function getLocalModulesClassNames() {
    return (await (0, localModules_1.getMirrorStateObject)()).swiftModuleClassNames;
}
//# sourceMappingURL=iosLocalModules.js.map