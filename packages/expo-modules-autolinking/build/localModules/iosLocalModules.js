"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIosLocalModulesClassNames = getIosLocalModulesClassNames;
const localModules_1 = require("./localModules");
async function getIosLocalModulesClassNames() {
    return (await (0, localModules_1.getMirrorStateObject)()).swiftModuleClassNames;
}
//# sourceMappingURL=iosLocalModules.js.map