import React, { useEffect, useState } from 'react'
import { Theme, View } from 'tamagui'
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
//
// The active panel fills the whole sheet and the segmented control floats on top of it, so the
// control's surroundings are whatever is behind it — the dark camera surround while scanning, the
// (themed) Receive view on My code — and always match. The control itself is kept dark in both
// tabs to match the Figma frames.
export function ScanConnect() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<ScanConnectTab>('scan')
  // Reserve room at the bottom of the My code panel so the floating control never overlaps content.
  const controlClearance = (typeof insets.bottom === 'number' ? insets.bottom : 0) + 64

  const scanActive = tab === 'scan'

  // The My code tab renders a CPU-heavy QR. Defer mounting it off the first render so the scanner
  // sheet appears immediately; by the time the user switches tabs it is ready.
  const [isMyCodeMounted, setIsMyCodeMounted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMyCodeMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <View flex={1} backgroundColor="$background">
      {/* Both panels stay laid out and painted; we toggle opacity rather than `display` so revealing
          the My code QR is a cheap GPU composite, not a first layout/paint that would jank the
          tab-switch animation. */}
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
        bottom="$8"
        paddingHorizontal="$4"
        paddingTop="$3"
        paddingBottom={insets.bottom || '$4'}
        pointerEvents="box-none"
      >
        <Theme name="dark">
          <SegmentedControl options={TABS} value={tab} onChange={setTab} testID="scan-connect-tabs" />
        </Theme>
      </View>
    </View>
  )
}
