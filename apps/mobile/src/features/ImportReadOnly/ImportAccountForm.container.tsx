import { View, Text, ScrollView } from 'tamagui'
import { useLocalSearchParams } from 'expo-router'
import { LargeHeaderTitle } from '@/src/components/Title/LargeHeaderTitle'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import React, { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { makeSafeId } from '@/src/utils/formatters'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { NetworkBadgeContainer } from '@/src/features/ImportReadOnly/NetworkBadge.container'
import { useRouter } from 'expo-router'
import { SafeInput } from '@/src/components/SafeInput/SafeInput'
import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { isValidAddress } from '@safe-global/utils/validation'
import { parsePrefixedAddress } from '@safe-global/utils/addresses'
import { CircleSnail } from 'react-native-progress'

const AvailableNetworks = ({ networks }: { networks: SafeOverview[] }) => {
  return (
    <YStack marginTop={'$5'} gap={'$1'}>
      <Text fontWeight={'600'}>Available on networks:</Text>
      <XStack gap={'$1'} marginTop={'$3'}>
        {networks?.map((safe) => <NetworkBadgeContainer key={safe.chainId} chainId={safe.chainId} />)}
      </XStack>
    </YStack>
  )
}
export const ImportAccountFormContainer = () => {
  const params = useLocalSearchParams<{ safeAddress: string }>()
  const [safeAddress, setSafeAddress] = useState(params.safeAddress || '')
  const chainIds = useAppSelector(selectAllChainsIds)
  const router = useRouter()
  const [isEnteredAddressValid, setEnteredAddressValid] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [addressWithoutPrefix, setAddressWithoutPrefix] = useState<string | undefined>(undefined)

  const { handleScroll } = useScrollableHeader({
    children: (
      <>
        <NavBarTitle paddingRight={5}>Import Safe account</NavBarTitle>
      </>
    ),
  })

  const [trigger, result] = useLazySafesGetOverviewForManyQuery()

  const safeExists = result.data && result.data?.length > 0
  const insets = useSafeAreaInsets()

  const onChangeText = (text: string) => {
    const { address } = parsePrefixedAddress(text)
    const shouldContinue = isValidAddress(address)
    const isValid = isValidAddress(address)
    if (isValid) {
      trigger({
        safes: chainIds.map((chainId: string) => makeSafeId(chainId, address)),
        currency: 'usd',
        trusted: true,
        excludeSpam: true,
      })
    }

    setEnteredAddressValid(isValid)
    setError(shouldContinue ? undefined : 'Invalid address format')
    setSafeAddress(text)
    setAddressWithoutPrefix(address)
  }

  const canContinue = isEnteredAddressValid && safeExists && !error

  console.log('chainid', result.data?.[0].chainId)
  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom + insets.top }]}>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.bottom + insets.top + 45}
      >
        <ScrollView
          paddingHorizontal={'$3'}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          style={{ flex: 1 }}
        >
          <LargeHeaderTitle marginBottom={'$4'}>Import Safe account</LargeHeaderTitle>
          <Text marginBottom={'$4'}>Paste the address of an account you want to import.</Text>
          <SafeInput
            value={safeAddress}
            onChangeText={onChangeText}
            multiline={true}
            placeholder="Paste address..."
            error={error && error.length > 0 ? error : undefined}
            success={canContinue}
            left={
              addressWithoutPrefix ? (
                <Identicon address={addressWithoutPrefix as `0x${string}`} size={32} />
              ) : (
                <View width={32} />
              )
            }
            right={
              result?.data?.length && !error ? (
                <SafeFontIcon name={'check-filled'} size={20} color={'$success'} />
              ) : (
                <View width={20} />
              )
            }
          />

          {result.isLoading ? (
            <XStack marginTop={'$5'} gap={'$1'}>
              <CircleSnail size={16} borderWidth={0} thickness={1} />
              <Text marginLeft={'$1'}>Verifying address...</Text>
            </XStack>
          ) : result.data?.length ? (
            <AvailableNetworks networks={result.data} />
          ) : (
            <XStack marginTop={'$5'} gap={'$1'}>
              {isEnteredAddressValid && <Text color={'$error'}>No Safe deployment found for this this address</Text>}
            </XStack>
          )}
        </ScrollView>
        <View paddingHorizontal={'$3'}>
          <SafeButton
            primary
            onPress={() => {
              router.push(
                `/(import-accounts)/signers?safeAddress=${addressWithoutPrefix}&chainId=${result.data?.[0].chainId}`,
              )
            }}
            disabled={!isEnteredAddressValid || !safeExists}
          >
            Continue
          </SafeButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#000', // Black background
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})
