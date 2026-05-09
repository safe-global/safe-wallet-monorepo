import React, { useCallback } from 'react'
import { Alert, Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useAppDispatch } from '@/src/store/hooks'
import { mergeContactChainIds } from '@/src/store/addressBookSlice'

interface KnownOtherChainWarningProps {
  contactAddress: string
  chainId: string
  chainName: string
}

export function KnownOtherChainWarning({ contactAddress, chainId, chainName }: KnownOtherChainWarningProps) {
  const dispatch = useAppDispatch()

  const handleUpdateAddressBook = useCallback(() => {
    Alert.alert(
      'Update address book',
      `Add ${chainName} to this contact's networks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            dispatch(mergeContactChainIds({ value: contactAddress, chainIds: [chainId] }))
          },
        },
      ],
      { cancelable: true },
    )
  }, [dispatch, contactAddress, chainId, chainName])

  return (
    <View gap="$4" paddingTop="$2">
      <View gap="$2">
        <Text fontSize={20} fontWeight="600" color="$color">
          Unknown recipient on this network
        </Text>
        <Text fontSize="$5" color="$colorSecondary" lineHeight={22}>
          This address is already saved in your address book, but for a different network. Are you sure you want to send
          funds on {chainName}?
        </Text>
      </View>

      <Pressable onPress={handleUpdateAddressBook} testID="update-address-book">
        <View flexDirection="row" alignItems="center" gap="$3" paddingVertical="$3" paddingRight="$3">
          <View
            width={40}
            height={40}
            borderRadius={20}
            backgroundColor="$backgroundSkeleton"
            alignItems="center"
            justifyContent="center"
          >
            <SafeFontIcon name="send-to-user" size={24} color="$color" />
          </View>
          <Text fontSize="$5" color="$color">
            Update address book
          </Text>
        </View>
      </Pressable>
    </View>
  )
}
