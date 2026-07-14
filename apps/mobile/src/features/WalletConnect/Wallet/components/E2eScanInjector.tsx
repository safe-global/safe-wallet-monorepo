import type { Code } from 'react-native-vision-camera'

export type E2eScanInjectorProps = {
  onScan: (codes: Code[]) => void
}

/**
 * Production no-op. Maestro cannot drive the device camera, so the E2E build
 * swaps this for `E2eScanInjector.e2e.tsx`, which feeds a typed URI into the
 * real `onScan` handler. Renders nothing (and is tree-shaken) in production.
 */
export const E2eScanInjector = (_props: E2eScanInjectorProps): null => null
