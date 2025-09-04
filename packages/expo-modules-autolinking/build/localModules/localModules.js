"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMirroStateObject = getMirroStateObject;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mirrorStateFileName = 'mirror.json';
function getMirroStateObject(projectRoot) {
    const localModulesPath = path_1.default.resolve(projectRoot, './.expo/localModules/');
    const mirrorFilePath = path_1.default.resolve(localModulesPath, mirrorStateFileName);
    return JSON.parse(fs_1.default.readFileSync(mirrorFilePath).toString());
}
//# sourceMappingURL=localModules.js.map