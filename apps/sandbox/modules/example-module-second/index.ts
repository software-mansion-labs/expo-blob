// Reexport the native module. On web, it will be resolved to ExampleModuleSecondModule.web.ts
// and on native platforms to ExampleModuleSecondModule.ts
export { default } from './src/ExampleModuleSecondModule';
export { default as ExampleModuleSecondView } from './src/ExampleModuleSecondView';
export * from  './src/ExampleModuleSecond.types';
