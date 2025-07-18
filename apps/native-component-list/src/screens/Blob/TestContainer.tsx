import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import Button from '../../components/Button';

export function TestContainer({
  children,
  title,
  disabled,
}: {
  children: any;
  title: string;
  disabled?: boolean;
}) {
  const [testStarted, setTestStarted] = useState(false);
  const showButton = (disabled === undefined || !disabled) && testStarted;
  return (
    <View style={styles.container}>
      <Button disabled={showButton} onPress={() => setTestStarted(true)} title={title} />
      {testStarted && children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
