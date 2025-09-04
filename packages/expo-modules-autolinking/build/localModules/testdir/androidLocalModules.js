"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSymlinksInDirectory = generateSymlinksInDirectory;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function generateSymlinksInDirectory(targetPath, appRoot) {
    const mirrorJsonPath = path_1.default.resolve(appRoot, '.expo/localModules/mirror.json');
    return JSON.parse(fs_1.default.readFileSync(mirrorJsonPath).toString());
}
//# sourceMappingURL=androidLocalModules.js.map