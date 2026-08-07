import React, { useEffect, useState } from 'react'
import { getTokenValue, Theme, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ShareContainer } from '@/src/features/Share'
import { SegmentedControl, type SegmentedControlOption } from '@/src/components/SegmentedControl'
import { WalletConnectScanContainer } from './WalletConnectScan.container'

type ScanConnectTab = 'scan' | 'mycode'

const TABS: SegmentedControlOption<ScanConnectTab>[] = [
  { label: 'Scan QR', value: 'scan' },
  { label: 'My code', value: 'mycode' },
]

const CONTROL_BOTTOM_OFFSET = '$8'
// Control height + surrounding padding; the My code panel reserves this as bottom clearance.
const CONTROL_FOOTPRINT = 64
const CONTROL_WIDTH = '50%'

// Both panels stay mounted so switching preserves scanner state; the scanner camera is paused via
// `isActive` while the My code tab is hidden.
export function ScanConnect() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<ScanConnectTab>('scan')
  const controlClearance = insets.bottom + getTokenValue(CONTROL_BOTTOM_OFFSET) + CONTROL_FOOTPRINT

  const scanActive = tab === 'scan'

  // Defer mounting the CPU-heavy My code QR so the scanner sheet opens immediately.
  const [isMyCodeMounted, setIsMyCodeMounted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMyCodeMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <View flex={1} backgroundColor="$background">
      {/* Toggle opacity, not `display`, so revealing the QR is a GPU composite and never janks the switch. */}
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={scanActive ? 1 : 0}
        pointerEvents={scanActive ? 'auto' : 'none'}
        testID="scan-connect-scan-panel"
      >
        <WalletConnectScanContainer isActive={scanActive} />
      </View>
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={scanActive ? 0 : 1}
        pointerEvents={scanActive ? 'none' : 'auto'}
        paddingBottom={controlClearance}
        testID="scan-connect-mycode-panel"
      >
        {isMyCodeMounted || tab === 'mycode' ? <ShareContainer /> : null}
      </View>

      <View
        position="absolute"
        left={0}
        right={0}
        bottom={CONTROL_BOTTOM_OFFSET}
        paddingHorizontal="$4"
        paddingTop="$3"
        paddingBottom={insets.bottom || '$4'}
        pointerEvents="box-none"
      >
        <Theme name="dark">
          <View width={CONTROL_WIDTH} alignSelf="center">
            <SegmentedControl options={TABS} value={tab} onChange={setTab} testID="scan-connect-tabs" />
          </View>
        </Theme>
      </View>
    </View>
  )
}
