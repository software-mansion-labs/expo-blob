"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSymlinksInDirectory = generateSymlinksInDirectory;
exports.getAndroidLocalModulesClasses = getAndroidLocalModulesClasses;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const localModules_1 = require("./localModules");
async function generateSymlinksInDirectory(targetPath) {
    const mirrorJson = await (0, localModules_1.getMirrorStateObject)();
    const appRoot = await (0, localModules_1.getAppRoot)();
    for (const file of mirrorJson.files) {
        if (!file.endsWith('.kt')) {
            continue;
        }
        const symlinkPath = path_1.default.resolve(path_1.default.dirname(targetPath), path_1.default.relative(appRoot, file));
        if (fs_1.default.existsSync(symlinkPath)) {
            continue;
        }
        fs_1.default.mkdirSync(path_1.default.dirname(symlinkPath), { recursive: true });
        fs_1.default.symlinkSync(file, symlinkPath);
    }
}
async function getAndroidLocalModulesClasses() {
    const mirrorJson = await (0, localModules_1.getMirrorStateObject)();
    return mirrorJson.kotlinClasses;
}
//# sourceMappingURL=androidLocalModules.js.map