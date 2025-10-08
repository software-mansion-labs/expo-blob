import { Text } from 'react-native';

import SimpleModule from './localModulesExamples/SimpleModule.module';
import TestView, { ViewProps, URL } from './localModulesExamples/TestView.view';

export default function LocalModulesScreen() {
  return (
    <>
      <Text>
        {SimpleModule.test}, Test classes in other files text: {SimpleModule.testOtherFile}
      </Text>
      <TestView style={{ flex: 1 }} url="https://docs.expo.dev/modules/" />
    </>
  );
}
