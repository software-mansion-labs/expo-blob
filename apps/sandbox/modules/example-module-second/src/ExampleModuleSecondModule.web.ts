import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExampleModuleSecond.types';

type ExampleModuleSecondModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExampleModuleSecondModule extends NativeModule<ExampleModuleSecondModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExampleModuleSecondModule, 'ExampleModuleSecondModule');
