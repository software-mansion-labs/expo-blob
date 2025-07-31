import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExampleModuleViewProps } from './ExampleModule.types';

const NativeView: React.ComponentType<ExampleModuleViewProps> =
  requireNativeView('ExampleModule');

export default function ExampleModuleView(props: ExampleModuleViewProps) {
  return <NativeView {...props} />;
}
