import { getMirrorStateObject } from './localModules';

export async function getLocalModulesKotlinFilesPaths(): Promise<{ path: string }[]> {
  const mirror = await getMirrorStateObject();
  const ret: { path: string }[] = [];
  for (const file of mirror.files) {
    if (file && file.endsWith('.kt')) {
      ret.push({ path: file });
    }
  }
  return ret;
}
