import { Text } from 'react-native';

import SimpleModule from './SimpleModule.module';
import TestView from './TestView.view';

export default function LocalModulesDemoComponent() {
  return (
    <>
      <Text>{SimpleModule.test}</Text>
      <TestView style={{ flex: 1 }} url="https://docs.expo.dev/modules/" />
    </>
  );
}
