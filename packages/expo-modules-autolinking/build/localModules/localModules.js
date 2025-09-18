"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppRoot = getAppRoot;
exports.getMirrorStateObject = getMirrorStateObject;
const find_up_1 = __importDefault(require("find-up"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const findPackageJsonPathAsync = async () => {
    const cwd = process.cwd();
    const result = await (0, find_up_1.default)('package.json', { cwd });
    if (!result) {
        throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
    }
    return result;
};
async function getAppRoot() {
    return path_1.default.dirname(await findPackageJsonPathAsync());
}
function trimExtension(fileName) {
    return fileName.substring(0, fileName.lastIndexOf('.'));
}
function getKotlinFileNameWithItsPackage(absoluteFilePath) {
    const pacakgeRegex = /^package\s+/;
    const lines = fs_1.default.readFileSync(absoluteFilePath).toString().split('\n');
    const packageLine = lines.findIndex((line) => pacakgeRegex.test(line));
    if (packageLine < 0) {
        return '';
    }
    const packageName = lines[packageLine].substring('package '.length);
    return packageName + '.' + trimExtension(path_1.default.basename(absoluteFilePath));
}
function getSwiftModuleClassName(absoluteFilePath) {
    return trimExtension(path_1.default.basename(absoluteFilePath));
}
async function getMirrorStateObject(watchedDirs) {
    const appRoot = await getAppRoot();
    const localModulesMirror = {
        kotlinClasses: [],
        swiftModuleClassNames: [],
        files: [],
    };
    const recursivelyScanDirectory = async (absoluteDirPath) => {
        const dir = fs_1.default.opendirSync(absoluteDirPath);
        for await (const dirent of dir) {
            const absoluteDirentPath = path_1.default.resolve(absoluteDirPath, dirent.name);
            if (dirent.isDirectory()) {
                await recursivelyScanDirectory(absoluteDirentPath);
            }
            if (!dirent.isFile()) {
                continue;
            }
            if (/\.(kt)$/.test(dirent.name)) {
                const kotlinFileWithPackage = getKotlinFileNameWithItsPackage(absoluteDirentPath);
                localModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
                localModulesMirror.files.push(absoluteDirentPath);
            }
            else if (/\.(swift)$/.test(dirent.name)) {
                const swiftClassName = getSwiftModuleClassName(absoluteDirentPath);
                localModulesMirror.swiftModuleClassNames.push(swiftClassName);
                localModulesMirror.files.push(absoluteDirentPath);
            }
        }
    };
    for (const dir of watchedDirs ?? []) {
        await recursivelyScanDirectory(path_1.default.resolve(appRoot, dir));
    }
    return localModulesMirror;
}
//# sourceMappingURL=localModules.js.map