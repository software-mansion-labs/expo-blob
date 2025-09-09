"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localModulesMirrorExists = localModulesMirrorExists;
exports.localModulesEnabled = localModulesEnabled;
exports.getAppRoot = getAppRoot;
exports.getMirrorStateObject = getMirrorStateObject;
exports.getLocalModulesKotlinFilesPaths = getLocalModulesKotlinFilesPaths;
const find_up_1 = __importDefault(require("find-up"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// copied from autolinkingOptions, maybe export it somewhere
const findPackageJsonPathAsync = async () => {
    const cwd = process.cwd();
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', '!!! cwd: ' + cwd + '\n', { flag: 'a+' });
    const result = await (0, find_up_1.default)('package.json', { cwd });
    if (!result) {
        throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
    }
    return result;
};
async function localModulesMirrorExists() {
    const appRoot = await getAppRoot();
    const localModulesPath = path_1.default.resolve(appRoot, './.expo/localModules/');
    const mirrorFilePath = path_1.default.resolve(localModulesPath, mirrorStateFileName);
    return fs_1.default.existsSync(mirrorFilePath);
}
async function localModulesEnabled() {
    const appJsonPath = path_1.default.resolve(path_1.default.dirname(await findPackageJsonPathAsync()), 'app.json');
    const obj = JSON.parse(fs_1.default.readFileSync(appJsonPath).toString());
    fs_1.default.writeFileSync('/Users/hubertb/Projects/expo-blob/apps/sandbox/debug.txt', 
    // `!!! ${JSON.stringify(obj?.expo)} ${JSON.stringify(obj?.expo?.experiments)} ${obj?.expo?.experiments?.localModules} \n`,
    `${JSON.parse(fs_1.default.readFileSync(appJsonPath).toString())?.expo?.experiments?.localModules === true}`, { flag: 'a+' });
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
async function getLocalModulesKotlinFilesPaths() {
    const mirror = await getMirrorStateObject();
    const ret = [];
    for (const file of mirror.files) {
        if (file && file.endsWith('.kt')) {
            ret.push({ path: file });
        }
    }
    return ret;
}
//# sourceMappingURL=localModules.js.map