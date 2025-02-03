import React from 'react'
import { MenuView } from '@react-native-menu/menu'
import { useSignersActions } from './hooks/useSignersActions'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SignerSection } from './SignersList'
import { View } from 'tamagui'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useRouter } from 'expo-router'

interface SignersListItemProps {
  item: AddressInfo
  index: number
  signersGroup: SignerSection[]
}

function SignersListItem({ item, index, signersGroup }: SignersListItemProps) {
  const router = useRouter()
  const actions = useSignersActions()
  const isLastItem = signersGroup.some((section) => section.data.length === index + 1)

  const onPress = () => {
    router.push(`/signers/${item.value}`)
  }

  return (
    <TouchableOpacity onPress={onPress}>
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
            <MenuView onPressAction={console.log} actions={actions}>
              <SafeFontIcon name="options-horizontal" />
            </MenuView>
          }
        />
      </View>
    </TouchableOpacity>
  )
}

export default SignersListItem
