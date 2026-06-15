import React, { useState } from 'react'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ShareContainer } from '@/src/features/Share'
import { SegmentedControl, type SegmentedControlOption } from '@/src/components/SegmentedControl'
import { WalletConnectScanContainer } from './WalletConnectScan.container'

type ScanConnectTab = 'scan' | 'mycode'

const TABS: SegmentedControlOption<ScanConnectTab>[] = [
  { label: 'Scan QR', value: 'scan' },
  { label: 'My code', value: 'mycode' },
]

// Tabbed shell for the WalletConnect QR sheet: a Scan QR tab (the camera scanner) and a My code
// tab that reuses the home-screen Receive surface (ShareContainer). Both panels stay mounted and
// the inactive one is hidden so switching tabs preserves scanner state; the scanner camera is
// paused via `isActive` while the My code tab is open.
export function ScanConnect() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<ScanConnectTab>('scan')

  return (
    <View flex={1} backgroundColor="$background">
      <View flex={1}>
        <View flex={1} display={tab === 'scan' ? 'flex' : 'none'} testID="scan-connect-scan-panel">
          <WalletConnectScanContainer isActive={tab === 'scan'} />
        </View>
        <View
          flex={1}
          display={tab === 'mycode' ? 'flex' : 'none'}
          paddingHorizontal="$4"
          testID="scan-connect-mycode-panel"
        >
          <ShareContainer />
        </View>
      </View>

      <View paddingHorizontal="$4" paddingTop="$3" paddingBottom={insets.bottom || '$4'}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} testID="scan-connect-tabs" />
      </View>
    </View>
  )
}
