// Reexport the native module. On web, it will be resolved to ExampleModule.web.ts
// and on native platforms to ExampleModule.ts
export { default } from './src/ExampleModule';
export { default as ExampleModuleView } from './src/ExampleModuleView';
export * from  './src/ExampleModule.types';
