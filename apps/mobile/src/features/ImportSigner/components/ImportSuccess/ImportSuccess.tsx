import React from 'react'

import { Badge } from '@/src/components/Badge'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import SignersListItem from '@/src/features/Signers/components/SignersList/SignersListItem'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { Text, View } from 'tamagui'
import Logger from '@/src/utils/logger'
import { useAppSelector } from '@/src/store/hooks'
import { selectPendingSafe } from '@/src/store/signerImportFlowSlice'

export function ImportSuccess() {
  const { address, name } = useLocalSearchParams<{
    address: `0x${string}`
    name: string
  }>()
  const router = useRouter()
  const pendingSafe = useAppSelector(selectPendingSafe)

  const handleDonePress = async () => {
    try {
      router.dismissAll()
      if (pendingSafe) {
        router.dismissTo({
          pathname: '/(import-accounts)/signers',
          params: {
            safeAddress: pendingSafe.address,
            safeName: pendingSafe.name,
          },
        })
      } else {
        router.dismissTo('/signers')
      }
    } catch (error) {
      Logger.error('Navigation error:', error)
    }
  }

  return (
    <View flex={1} justifyContent="space-between" testID={'import-success'}>
      <AbsoluteLinearGradient />

      <View flex={1}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
            <View alignItems="center" alignSelf="stretch" gap="$5">
              <Badge
                circleProps={{ backgroundColor: '$backgroundSuccess' }}
                themeName="badge_success"
                circleSize={64}
                content={<SafeFontIcon size={32} color="$success" name="check-filled" />}
              />

              <View width="100%" alignItems="center">
                <Text fontWeight="700" fontSize={24} lineHeight={32} textAlign="center" color="$color">
                  Your signer is ready!
                </Text>
                <Text textAlign="center" fontSize="$4" color="$colorSecondary" lineHeight={20}>
                  You can now use this signer to manage your Safe.
                </Text>
              </View>

              <View width="100%">
                <SignersListItem
                  item={{ value: address, name }}
                  signersGroup={[{ id: 'imported_signers', title: '', data: [{ value: address, name }] }]}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <View paddingHorizontal="$4">
        <SafeButton onPress={handleDonePress} testID={'import-success-continue'}>
          Done
        </SafeButton>
      </View>
    </View>
  )
}
