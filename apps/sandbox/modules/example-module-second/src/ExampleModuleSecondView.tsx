import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExampleModuleSecondViewProps } from './ExampleModuleSecond.types';

const NativeView: React.ComponentType<ExampleModuleSecondViewProps> =
  requireNativeView('ExampleModuleSecond');

export default function ExampleModuleSecondView(props: ExampleModuleSecondViewProps) {
  return <NativeView {...props} />;
}
