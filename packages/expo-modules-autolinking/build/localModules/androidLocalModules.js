"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalModulesKotlinFilesPaths = getLocalModulesKotlinFilesPaths;
const localModules_1 = require("./localModules");
async function getLocalModulesKotlinFilesPaths() {
    const mirror = await (0, localModules_1.getMirrorStateObject)();
    const ret = [];
    for (const file of mirror.files) {
        if (file && file.endsWith('.kt')) {
            ret.push({ path: file });
        }
    }
    return ret;
}
//# sourceMappingURL=androidLocalModules.js.map