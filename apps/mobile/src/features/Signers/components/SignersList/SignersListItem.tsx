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
import { Alert, useColorScheme } from 'react-native'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress, upsertContact } from '@/src/store/addressBookSlice'

interface SignersListItemProps {
  item: AddressInfo
  index: number
  signersGroup: SignerSection[]
}

function SignersListItem({ item, index, signersGroup }: SignersListItemProps) {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const contact = useAppSelector(selectContactByAddress(item.value))
  const local = useLocalSearchParams<{ safeAddress: string; chainId: string; import_safe: string }>()
  const actions = useSignersActions()
  const isLastItem = signersGroup.some((section) => section.data.length === index + 1)
  const dispatch = useAppDispatch()
  const onPress = () => {
    router.push(`/signers/${item.value}`)
  }

  const onPressMenuAction = ({ nativeEvent }: NativeActionEvent) => {
    if (nativeEvent.event === 'rename') {
      Alert.prompt('Rename signer', 'Enter a new name for the signer', (newName) => {
        if (newName) {
          dispatch(upsertContact({ ...contact, value: item.value, name: newName }))
        }
      })
    }

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
        backgroundColor={colorScheme === 'dark' ? '$backgroundPaper' : '$background'}
        borderTopRightRadius={index === 0 ? '$4' : undefined}
        borderTopLeftRadius={index === 0 ? '$4' : undefined}
        borderBottomRightRadius={isLastItem ? '$4' : undefined}
        borderBottomLeftRadius={isLastItem ? '$4' : undefined}
      >
        <SignersCard
          name={contact ? (contact.name as string) : (item.name as string)}
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
