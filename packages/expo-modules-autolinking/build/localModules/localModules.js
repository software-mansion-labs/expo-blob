"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localModulesEnabled = localModulesEnabled;
exports.getAppRoot = getAppRoot;
exports.getMirrorStateObject = getMirrorStateObject;
const find_up_1 = __importDefault(require("find-up"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// copied from autolinkingOptions, maybe export it somewhere
const findPackageJsonPathAsync = async () => {
    const cwd = process.cwd();
    const result = await (0, find_up_1.default)('package.json', { cwd });
    if (!result) {
        throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
    }
    return result;
};
async function localModulesEnabled() {
    const appJsonPath = await findPackageJsonPathAsync();
    return (JSON.parse(fs_1.default.readFileSync(appJsonPath).toString())?.expo?.experiments?.localModules === true);
}
async function getAppRoot() {
    return path_1.default.dirname(await findPackageJsonPathAsync());
}
const mirrorStateFileName = 'mirror.json';
async function getMirrorStateObject() {
    const appRoot = await getAppRoot();
    const localModulesPath = path_1.default.resolve(appRoot, './.expo/localModules/');
    const mirrorFilePath = path_1.default.resolve(localModulesPath, mirrorStateFileName);
    return JSON.parse(fs_1.default.readFileSync(mirrorFilePath).toString());
}
//# sourceMappingURL=localModules.js.map