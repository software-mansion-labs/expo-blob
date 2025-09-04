"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSymlinksInDirectory = generateSymlinksInDirectory;
exports.getAndroidLocalModulesClasses = getAndroidLocalModulesClasses;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function generateSymlinksInDirectory(targetPath, appRoot) {
    const mirrorJsonPath = path_1.default.resolve(appRoot, '.expo/localModules/mirror.json');
    const mirrorJson = JSON.parse(fs_1.default.readFileSync(mirrorJsonPath).toString());
    for (const file of mirrorJson.files) {
        if (!file.endsWith('.kt')) {
            continue;
        }
        if (fs_1.default.existsSync(path_1.default.resolve(path_1.default.dirname(targetPath), path_1.default.basename(file)))) {
            continue;
        }
        fs_1.default.symlinkSync(file, path_1.default.resolve(path_1.default.dirname(targetPath), path_1.default.basename(file)));
    }
}
function getAndroidLocalModulesClasses(appRoot) {
    const mirrorJsonPath = path_1.default.resolve(appRoot, '.expo/localModules/mirror.json');
    const mirrorJson = JSON.parse(fs_1.default.readFileSync(mirrorJsonPath).toString());
    return mirrorJson.kotlinClasses;
}
//# sourceMappingURL=androidLocalModules.js.map