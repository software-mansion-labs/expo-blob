export type LocalModulesMirror = {
    files: string[];
    swiftModuleClassNames: string[];
    kotlinClasses: string[];
};
export declare function localModulesEnabled(): Promise<boolean>;
export declare function getAppRoot(): Promise<string>;
export declare function getMirrorStateObject(): Promise<LocalModulesMirror>;
