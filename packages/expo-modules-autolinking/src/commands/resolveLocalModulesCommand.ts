import commander from 'commander';

import {
  AutolinkingCommonArguments,
  createAutolinkingOptionsLoader,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { getLocalModulesKotlinFilesPaths } from '../localModules/androidLocalModules';
import type {
  ModuleDescriptor,
  CommonNativeModuleDescriptor,
  ModuleDescriptorAndroid,
  ModuleDescriptorIos,
} from '../types';

function hasCoreFeatures(
  module: ModuleDescriptor
): module is ModuleDescriptorAndroid | ModuleDescriptorIos {
  return (module as CommonNativeModuleDescriptor).coreFeatures !== undefined;
}

interface ResolveArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

/** Searches for available expo modules and resolves the results for given platform. */
export function resolveLocalModulesCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('resolveLocalModules'))
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (commandArguments: ResolveArguments) => {
      const platform = commandArguments.platform ?? 'android';
      if (platform !== 'android') {
        console.log('resolve local modules only supported for android.');
      }
      const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
        ...commandArguments,
      });

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
