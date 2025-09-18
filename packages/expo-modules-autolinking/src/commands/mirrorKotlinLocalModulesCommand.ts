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
    cli.command(
      'mirror-kotlin-local-modules <mirrorPath> <localModulesListPath> <watchedDirsSerialized>'
    )
  ).action(
    async (
      mirrorPath: string,
      localModulesListPath: string,
      watchedDirsSerialized: string,
      commandArguments: ResolveArguments
    ) => {
      const watchedDirs = JSON.parse(watchedDirsSerialized);
      if (!mirrorPath || !localModulesListPath) {
        console.log('Need to provide mirrorPath and localModulesListPath!');
        return;
      }
      if (!/.android./.test(mirrorPath) || !/.android./.test(localModulesListPath)) {
        console.log('Generation path is not inside any android directory!');
        return;
      }
      if (!path.isAbsolute(mirrorPath) || !path.isAbsolute(localModulesListPath)) {
        console.log(
          'Need to provide the absolute path to both the local modules src mirror and generated mirror directory!'
        );
        return;
      }

      fs.rmSync(mirrorPath, { recursive: true, force: true });
      await createSymlinksToKotlinFiles(mirrorPath, watchedDirs);
      await generateLocalModulesListFile(localModulesListPath, watchedDirs);
    }
  );
}
