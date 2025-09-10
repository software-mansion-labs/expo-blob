import commander from 'commander';
import fs from 'fs';
import path from 'path';

import { AutolinkingCommonArguments, registerAutolinkingArguments } from './autolinkingOptions';
import {
  createSymlinksToKotlinFiles,
  generateLocalModulesListFile,
  getLocalModulesKotlinFilesPaths,
} from '../localModules/androidLocalModules';
import { getAppRoot, getMirrorStateObject } from '../localModules/localModules';
import { cwd } from 'process';

interface ResolveArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

export function resolveLocalModulesCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('resolveLocalModules'))
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (commandArguments: ResolveArguments) => {
      const platform = commandArguments.platform ?? 'android';
      if (platform !== 'android') {
        console.log('resolve local modules only supported for android.');
      }

      const localModules: { path: string }[] = await getLocalModulesKotlinFilesPaths();

      if (commandArguments.json) {
        console.log(
          JSON.stringify({
            modules: localModules,
          })
        );
      } else {
        console.log(
          require('util').inspect(
            {
              modules: localModules,
            },
            false,
            null,
            true
          )
        );
      }
    });
}

export function prepareLocalModulesAndroidDirectory(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(
    cli.command('mirror-kotlin-local-modules <mirrorPath>')
  ).action(async (mirrorPath: string, commandArguments: ResolveArguments) => {
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
    await createSymlinksToKotlinFiles(mirrorPath);
    await generateLocalModulesListFile(mirrorPath);
  });
}
