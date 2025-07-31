import { NativeModule, requireNativeModule } from 'expo';

import { ExampleModuleEvents } from './ExampleModule.types';

declare class ExampleModule extends NativeModule<ExampleModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExampleModule>('ExampleModule');
