import React, { useState } from 'react'
import { Pressable, TextInput, StyleSheet } from 'react-native'
import { View, Text } from 'tamagui'
import type { Code } from 'react-native-vision-camera'
import type { E2eScanInjectorProps } from './E2eScanInjector'

/**
 * E2E-only affordance (Metro swaps this in via RN_SRC_EXT). Maestro cannot scan
 * a real QR through the simulator camera, so it types a `wc:` URI here and taps
 * Inject — this calls the scanner's real `onScan` with a QR-shaped Code, driving
 * the same pairing path (spinner, error overlay, try-again) a camera scan would.
 */
export const E2eScanInjector = ({ onScan }: E2eScanInjectorProps): React.ReactElement => {
  const [value, setValue] = useState('')

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TextInput
        testID="e2e-scan-input"
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="wc: URI"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        testID="e2e-scan-submit"
        onPress={() => onScan([{ value, type: 'qr' } as Code])}
        accessibilityRole="button"
        style={styles.submit}
      >
        <Text color="$color" fontSize="$3">
          Inject
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    zIndex: 100000,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
  },
  submit: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#cccccc',
    borderRadius: 4,
    alignItems: 'center',
  },
})
