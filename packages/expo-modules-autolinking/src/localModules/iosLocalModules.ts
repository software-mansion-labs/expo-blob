import { getMirrorStateObject } from './localModules';

export async function getIosLocalModulesClassNames(): Promise<string[]> {
  return (await getMirrorStateObject()).swiftModuleClassNames;
}
