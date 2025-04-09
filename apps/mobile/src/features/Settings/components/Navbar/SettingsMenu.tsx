import { getTokenValue, Theme, useTheme, XStack, View } from 'tamagui'
import { Pressable } from 'react-native-gesture-handler'
import { Linking, Platform, Alert } from 'react-native'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import React from 'react'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { useToastController } from '@tamagui/toast'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useEditAccountItem } from '@/src/features/AccountsSheet/AccountItem/hooks/useEditAccountItem'
import { type Address } from '@/src/types/address'
import { useRouter } from 'expo-router'
import { selectContactByAddress, upsertContact } from '@/src/store/addressBookSlice'
import { FloatingMenu } from '../FloatingMenu'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
type Props = {
  safeAddress: string | undefined
}
export const SettingsMenu = ({ safeAddress }: Props) => {
  const toast = useToastController()
  const insets = useSafeAreaInsets()
  const activeSafe = useDefinedActiveSafe()
  const { deleteSafe } = useEditAccountItem()
  const dispatch = useAppDispatch()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const copyAndDispatchToast = useCopyAndDispatchToast()
  const contact = useAppSelector(selectContactByAddress(activeSafe.address))
  const theme = useTheme()
  const color = theme.color?.get()
  const router = useRouter()
  const colorError = 'red'

  if (!safeAddress) {
    return null
  }

  return (
    <Theme name="navbar">
      <XStack
        paddingTop={getTokenValue('$2') + insets.top}
        justifyContent={'flex-end'}
        paddingHorizontal={16}
        alignItems={'center'}
        paddingBottom={'$2'}
        backgroundColor={'$background'}
      >
        <Pressable
          testID={'settings-screen-header-app-settings-button'}
          onPress={() => {
            router.push('/app-settings')
          }}
        >
          <View
            style={{
              backgroundColor: '$backgroundSkeleton',
              borderRadius: 16,
              marginRight: 4,
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            <SafeFontIcon name={'settings'} size={16} />
          </View>
        </Pressable>

        <FloatingMenu
          onPressAction={({ nativeEvent }) => {
            if (nativeEvent.event === 'rename') {
              Alert.prompt('Rename safe', 'Enter a new name for the safe', (newName) => {
                if (newName) {
                  dispatch(upsertContact({ ...contact, value: safeAddress, name: newName }))
                }
              })
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
              title: 'View on explorer',
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
              imageColor: colorError,
            },
          ]}
        >
          <Pressable testID={'settings-screen-header-more-settings-button'}>
            <View
              style={{
                backgroundColor: '$backgroundSkeleton',
                borderRadius: 16,
                marginLeft: 4,
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
              }}
            >
              <SafeFontIcon name={'options-horizontal'} size={16} />
            </View>
          </Pressable>
        </FloatingMenu>
      </XStack>
    </Theme>
  )
}
