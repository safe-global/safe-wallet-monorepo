import React from 'react'
import { MenuView, NativeActionEvent } from '@react-native-menu/menu'
import { useSignersActions } from './hooks/useSignersActions'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SignerSection } from './SignersList'
import { View } from 'tamagui'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useLocalSearchParams, useRouter } from 'expo-router'

interface SignersListItemProps {
  item: AddressInfo
  index: number
  signersGroup: SignerSection[]
}

function SignersListItem({ item, index, signersGroup }: SignersListItemProps) {
  const router = useRouter()
  const local = useLocalSearchParams<{ safeAddress: string; chainId: string; import_safe: string }>()
  const actions = useSignersActions()
  const isLastItem = signersGroup.some((section) => section.data.length === index + 1)

  const onPress = () => {
    router.push(`/signers/${item.value}`)
  }

  const onPressMenuAction = ({ nativeEvent }: NativeActionEvent) => {
    if (nativeEvent.event === 'import') {
      router.push({
        pathname: '/import-signers',
        params: {
          safeAddress: local.safeAddress,
          chainId: local.chainId,
          import_safe: local.import_safe,
        },
      })
    }
  }

  return (
    <TouchableOpacity onPress={onPress} testID={`signer-${item.value}`}>
      <View
        backgroundColor={'$backgroundPaper'}
        borderTopRightRadius={index === 0 ? '$4' : undefined}
        borderTopLeftRadius={index === 0 ? '$4' : undefined}
        borderBottomRightRadius={isLastItem ? '$4' : undefined}
        borderBottomLeftRadius={isLastItem ? '$4' : undefined}
      >
        <SignersCard
          name={item.name as string}
          address={item.value as `0x${string}`}
          rightNode={
            <MenuView onPressAction={onPressMenuAction} actions={actions}>
              <SafeFontIcon name="options-horizontal" />
            </MenuView>
          }
        />
      </View>
    </TouchableOpacity>
  )
}

export default SignersListItem
