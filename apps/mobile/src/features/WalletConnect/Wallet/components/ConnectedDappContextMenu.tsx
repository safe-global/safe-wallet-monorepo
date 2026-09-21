import React from 'react'
import { Platform } from 'react-native'
import { FloatingMenu, NATIVE_MENU_DESTRUCTIVE_COLOR } from '@/src/features/Settings/components/FloatingMenu'

interface Props {
  onDisconnect: () => void
  /** The trigger that opens the native menu (e.g. the row's 3-dots icon). */
  children: React.ReactNode
  testID?: string
  accessibilityLabel?: string
}

/** Native overflow menu for a connected dApp, consistent with the SettingsMenu. */
export const ConnectedDappContextMenu: React.FC<Props> = ({ onDisconnect, children, testID, accessibilityLabel }) => (
  <FloatingMenu
    testID={testID}
    accessibilityLabel={accessibilityLabel}
    onPressAction={({ nativeEvent }) => {
      if (nativeEvent.event === 'disconnect') {
        onDisconnect()
      }
    }}
    actions={[
      {
        id: 'disconnect',
        title: 'Disconnect',
        titleColor: NATIVE_MENU_DESTRUCTIVE_COLOR,
        attributes: { destructive: true },
        image: Platform.select({ ios: 'trash', android: 'baseline_delete_24' }),
        imageColor: NATIVE_MENU_DESTRUCTIVE_COLOR,
      },
    ]}
  >
    {children}
  </FloatingMenu>
)
