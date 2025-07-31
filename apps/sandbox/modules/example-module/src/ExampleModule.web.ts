import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExampleModule.types';

type ExampleModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExampleModule extends NativeModule<ExampleModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExampleModule, 'ExampleModule');
