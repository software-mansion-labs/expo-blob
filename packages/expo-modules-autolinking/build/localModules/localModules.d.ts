export type LocalModulesMirror = {
    files: string[];
    swiftModuleClassNames: string[];
    kotlinClasses: string[];
};
export declare function getMirroStateObject(projectRoot: string): LocalModulesMirror;
