import commander, { command } from 'commander';

import { registerAutolinkingArguments } from './autolinkingOptions';
import { getMirrorStateObject } from '../localModules/localModules';

export function getKotlinLocalModulesClassesCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(
    cli.command('get-kotlin-local-modules-classes <watchedDirs>')
  ).action(async (watchedDirsSerialized: string, commandArguments) => {
    const watchedDirs = JSON.parse(watchedDirsSerialized);
    console.log(
      JSON.stringify({ kotlinClasses: (await getMirrorStateObject(watchedDirs)).kotlinClasses })
    );
  });
}
