import React, { useMemo } from 'react'
import { MenuView, NativeActionEvent, MenuAction } from '@react-native-menu/menu'
import { useSignersActions } from './hooks/useSignersActions'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { WalletConnectBadge } from '@/src/features/WalletConnect/components/WalletConnectBadge'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SignerSection } from './SignersList'
import { View } from 'tamagui'
import { TouchableOpacity } from 'react-native'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { selectPendingSafe } from '@/src/store/signerImportFlowSlice'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import { ImportedBadge } from './ImportedBadge'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { router } from 'expo-router'
import logger from '@/src/utils/logger'

interface SignersListItemProps {
  item: AddressInfo
  signersGroup: SignerSection[]
}

function SignersListItem({ item, signersGroup }: SignersListItemProps) {
  const { isDark } = useTheme()
  const contact = useAppSelector(selectContactByAddress(item.value))
  const pendingSafe = useAppSelector(selectPendingSafe)
  const signer = useAppSelector((state) => selectSignerByAddress(state, item.value))

  const isMySigner = useMemo(
    () =>
      signersGroup.some(
        (section) => section.id === 'imported_signers' && section.data.some((s) => s.value === item.value),
      ),
    [signersGroup, item.value],
  )

  const fullActions = useSignersActions(isMySigner)
  const actions = fullActions.filter(Boolean) as MenuAction[]
  const copy = useCopyAndDispatchToast()

  const redirectToDetails = (editMode?: boolean) => {
    router.push({
      pathname: '/signers/[address]',
      params: { address: item.value, editMode: editMode?.toString() },
    })
  }

  const redirectToImport = () => {
    router.push('/import-signers')
  }

  const handleItemPress = () => {
    if (pendingSafe && !isMySigner) {
      return redirectToImport()
    }

    return redirectToDetails()
  }

  const onPressMenuAction = ({ nativeEvent }: NativeActionEvent) => {
    if (nativeEvent.event === 'rename') {
      return redirectToDetails(true)
    }

    if (nativeEvent.event === 'copy') {
      return copy(item.value as string)
    }

    if (nativeEvent.event === 'import' && !isMySigner) {
      return redirectToImport()
    }

    logger.error('No action found for nativeEvent', nativeEvent)
  }

  return (
    <View position="relative" marginBottom="$2">
      <TouchableOpacity onPress={handleItemPress} testID={`signer-${item.value}`}>
        <View backgroundColor={isDark ? '$backgroundPaper' : '$background'} borderRadius="$2" collapsable={false}>
          <SignersCard
            name={contact ? (contact.name as string) : (item.name as string)}
            address={item.value as `0x${string}`}
            rightNode={
              <View flexDirection="row" alignItems="center" flexShrink={0} gap="$2">
                {signer?.type === 'private-key' && <ImportedBadge />}

                {signer?.type === 'walletconnect' && (
                  <WalletConnectBadge address={item.value} testID={`wc-badge-${item.value}`} skipStatus />
                )}

                {/* Invisible spacer matching menu width so card content doesn't overlap */}
                <View width={32} />
              </View>
            }
          />
        </View>
      </TouchableOpacity>

      <View
        position="absolute"
        right={0}
        top={0}
        height={'100%'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="row"
      >
        <MenuView
          onPressAction={onPressMenuAction}
          actions={actions}
          style={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 16,
            paddingLeft: 16,
          }}
          testID="signer-menu"
        >
          <SafeFontIcon name="options-horizontal" />
        </MenuView>
      </View>
    </View>
  )
}

export default SignersListItem
