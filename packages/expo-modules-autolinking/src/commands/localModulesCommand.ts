import commander from 'commander';
import fs from 'fs';
import path from 'path';

import { AutolinkingCommonArguments, registerAutolinkingArguments } from './autolinkingOptions';
import {
  createSymlinksToKotlinFiles,
  generateLocalModulesListFile,
} from '../localModules/androidLocalModules';
interface ResolveArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

export function mirrorKotlinLocalModulesCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(
    cli.command('mirror-kotlin-local-modules <mirrorPath> <watchedDirs...>')
  ).action(
    async (mirrorPath: string, watchedDirs: string[], commandArguments: ResolveArguments) => {
      if (!mirrorPath) {
        console.log('No mirror path provieded!');
        return;
      }
      if (!/.android./.test(mirrorPath)) {
        console.log('the mirror path is not inside any android directory!');
        return;
      }
      if (!path.isAbsolute(mirrorPath)) {
        console.log('Need to provide the absolute path to the local modules andorid directory!');
        return;
      }

      fs.rmSync(mirrorPath, { recursive: true, force: true });
      await createSymlinksToKotlinFiles(mirrorPath, watchedDirs);
      await generateLocalModulesListFile(mirrorPath, watchedDirs);
    }
  );
}
