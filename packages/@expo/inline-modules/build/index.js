"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateXCodeProject = exports.findUpPackageJsonDirectoryCached = exports.startModuleGenerationAsync = void 0;
var generation_1 = require("./generation");
Object.defineProperty(exports, "startModuleGenerationAsync", { enumerable: true, get: function () { return generation_1.startModuleGenerationAsync; } });
Object.defineProperty(exports, "findUpPackageJsonDirectoryCached", { enumerable: true, get: function () { return generation_1.findUpPackageJsonDirectoryCached; } });
var xcodeProjectUpdates_1 = require("./xcodeProjectUpdates");
Object.defineProperty(exports, "updateXCodeProject", { enumerable: true, get: function () { return xcodeProjectUpdates_1.updateXCodeProject; } });
