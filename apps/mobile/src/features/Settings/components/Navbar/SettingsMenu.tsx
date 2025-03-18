import { Button, useTheme } from 'tamagui'
import { MenuView, NativeActionEvent } from '@react-native-menu/menu'
import { Linking, Platform, Alert } from 'react-native'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import React from 'react'
import { getExplorerLink } from '@safe-global/utils/gateway'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { useToastController } from '@tamagui/toast'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useEditAccountItem } from '@/src/features/AccountsSheet/AccountItem/hooks/useEditAccountItem'
import { type Address } from '@/src/types/address'
import { useRouter } from 'expo-router'

type Props = {
  safeAddress: string | undefined
}
export const SettingsMenu = ({ safeAddress }: Props) => {
  const toast = useToastController()
  const activeSafe = useDefinedActiveSafe()
  const { deleteSafe } = useEditAccountItem()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const copyAndDispatchToast = useCopyAndDispatchToast()
  const theme = useTheme()
  const color = theme.color?.get()
  const router = useRouter()
  const colorError = 'red'

  const toBeImplemented = () => {
    toast.show('This feature is not implemented yet.', {
      native: true,
      duration: 2000,
      burntOptions: {
        preset: 'error',
      },
    })
  }
  if (!safeAddress) {
    return null
  }

  return (
    <Menu
      onPressAction={({ nativeEvent }) => {
        console.warn(JSON.stringify(nativeEvent))

        if (nativeEvent.event === 'rename') {
          console.log('rename')
          toBeImplemented()
        }

        if (nativeEvent.event === 'explorer') {
          const link = getExplorerLink(safeAddress, activeChain.blockExplorerUriTemplate)
          Linking.openURL(link.href)
        }

        if (nativeEvent.event === 'copy') {
          copyAndDispatchToast(safeAddress)
        }

        if (nativeEvent.event === 'remove') {
          Alert.alert('Remove account', 'Are you sure you want to remove this account?', [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Remove',
              onPress: () => {
                deleteSafe(safeAddress as Address)

                toast.show(`The safe with address ${safeAddress} was deleted.`, {
                  native: true,
                  duration: 2000,
                })
              },
              style: 'destructive',
            },
          ])
        }

        if (nativeEvent.event === 'share') {
          router.push('/share')
        }
      }}
      color={color}
      destructiveColor={colorError}
    />
  )
}

type MenuProps = {
  onPressAction: (event: NativeActionEvent) => void
  color: string
  destructiveColor: string
}
const Menu = ({ onPressAction, color, destructiveColor }: MenuProps) => {
  return (
    <MenuView
      onPressAction={onPressAction}
      actions={[
        {
          id: 'rename',
          title: 'Rename',
          image: Platform.select({
            ios: 'pencil',
            android: 'baseline_create_24',
          }),
          imageColor: Platform.select({ ios: color, android: '#000' }),
        },
        {
          id: 'explorer',
          title: 'View on Explorer',
          image: Platform.select({
            ios: 'link',
            android: 'baseline_explore_24',
          }),
          imageColor: Platform.select({ ios: color, android: '#000' }),
        },
        {
          id: 'copy',
          title: 'Copy address',
          image: Platform.select({
            ios: 'doc.on.doc',
            android: 'baseline_auto_awesome_motion_24',
          }),
          imageColor: Platform.select({ ios: color, android: '#000' }),
        },
        {
          id: 'share',
          title: 'Share account',
          image: Platform.select({
            ios: 'square.and.arrow.up.on.square',
            android: 'baseline_arrow_outward_24',
          }),
          imageColor: Platform.select({ ios: color, android: '#000' }),
        },
        {
          id: 'remove',
          title: 'Remove account',
          attributes: {
            destructive: true,
          },
          image: Platform.select({
            ios: 'trash',
            android: 'baseline_delete_24',
          }),
          imageColor: destructiveColor,
        },
      ]}
      shouldOpenOnLongPress={false}
    >
      <Button
        testID={'settings-screen-header-more-settings-button'}
        size={'$8'}
        circular={true}
        scaleSpace={1.5}
        backgroundColor={'$backgroundSkeleton'}
      >
        <SafeFontIcon name={'options-horizontal'} size={16} />
      </Button>
    </MenuView>
  )
}
