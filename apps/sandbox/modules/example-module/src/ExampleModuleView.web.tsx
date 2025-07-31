import * as React from 'react';

import { ExampleModuleViewProps } from './ExampleModule.types';

export default function ExampleModuleView(props: ExampleModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
