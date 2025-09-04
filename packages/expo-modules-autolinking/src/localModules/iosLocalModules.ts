import { getMirrorStateObject } from './localModules';

export async function getLocalModulesClassNames(): Promise<string[]> {
  return (await getMirrorStateObject()).swiftModuleClassNames;
}
