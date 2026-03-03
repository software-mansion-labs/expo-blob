import commander from 'commander';
import fs from 'fs';
import path from 'path';

import { registerAutolinkingArguments } from './autolinkingOptions';
import {
  createSymlinksToKotlinFiles,
  generateInlineModulesListFile,
} from '../inlineModules/androidInlineModules';

type MirrorKotlinInlineModulesCommandArguments = {
  kotlinFilesMirrorDirectory: string;
  inlineModulesListDirectory: string;
  watchedDirectoriesSerialized: string;
};

export function mirrorKotlinInlineModulesCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('mirror-kotlin-inline-modules'))
    .requiredOption(
      '--kotlin-files-mirror-directory <path>',
      'Directory in which to create mirrors of watched directories'
    )
    .requiredOption(
      '--inline-modules-list-directory <path>',
      'Path to the directory in which to generate the inlineModulesList file.'
    )
    .requiredOption(
      '--watched-directories-serialized <watchedDirectories>',
      'JSON serialized watched directories array'
    )
    .action(async (options: MirrorKotlinInlineModulesCommandArguments) => {
      const {
        kotlinFilesMirrorDirectory,
        inlineModulesListDirectory,
        watchedDirectoriesSerialized,
      } = options;

      const watchedDirectories = JSON.parse(watchedDirectoriesSerialized);

      if (
        !/.android./.test(kotlinFilesMirrorDirectory) ||
        !/.android./.test(inlineModulesListDirectory)
      ) {
        throw new Error('Generation path is not inside any android directory!');
      }

      if (
        !path.isAbsolute(kotlinFilesMirrorDirectory) ||
        !path.isAbsolute(inlineModulesListDirectory)
      ) {
        throw new Error(
          'Need to provide the absolute path to both the kotlin files mirror and inline modules list directories!'
        );
      }

      await fs.promises.rm(kotlinFilesMirrorDirectory, { recursive: true, force: true });
      await createSymlinksToKotlinFiles(kotlinFilesMirrorDirectory, watchedDirectories);
      await generateInlineModulesListFile(inlineModulesListDirectory, watchedDirectories);
    });
}
