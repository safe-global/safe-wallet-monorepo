import { View } from 'tamagui'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { SafeButton } from '@/src/components/SafeButton'
import { StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { makeSafeId } from '@/src/utils/formatters'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { Address } from '@/src/types/address'
import { groupSigners } from '@/src/features/Signers/hooks/useSignersGroupService'
import { SignersList } from '@/src/features/Signers/components/SignersList'
import { selectSigners } from '@/src/store/signersSlice'
import { SignerSection } from '@/src/features/Signers/components/SignersList/SignersList'
import { extractChainsFromSafes, extractSignersFromSafes } from '@/src/features/ImportReadOnly/helpers/safes'

export const AddSignersFormContainer = () => {
  const params = useLocalSearchParams<{ safeAddress: string }>()
  const dispatch = useAppDispatch()
  const chainIds = useAppSelector(selectAllChainsIds)
  const appSigners = useAppSelector(selectSigners)
  const { currentData, isFetching } = useSafesGetOverviewForManyQuery({
    safes: chainIds.map((chainId: string) => makeSafeId(chainId, params.safeAddress)),
    currency: 'usd',
    trusted: true,
    excludeSpam: true,
  })

  const safeAvailableOnChains = extractChainsFromSafes(currentData || [])
  const signers = extractSignersFromSafes(currentData || [])
  const signersGroupedBySection = useMemo(() => groupSigners(Object.values(signers), appSigners), [signers, appSigners])

  const insets = useSafeAreaInsets()

  const signersSections = Object.keys(signersGroupedBySection)
    .map((group) => {
      return signersGroupedBySection[group].data.length ? signersGroupedBySection[group] : null
    })
    .filter(Boolean) as SignerSection[]

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom + insets.top }]}>
      <SignersList
        navbarTitle={'Import your signers to unlock account'}
        isFetching={isFetching}
        hasLocalSingers={!!signersGroupedBySection.imported?.data.length}
        signersGroup={signersSections}
      />

      <View style={{ paddingHorizontal: 16 }}>
        <SafeButton
          onPress={() => {
            if (!currentData) {
              return
            }
            dispatch(addSafe({ SafeInfo: currentData[0], chains: safeAvailableOnChains }))
            dispatch(
              setActiveSafe({
                address: currentData[0].address.value as Address,
                chainId: currentData[0].chainId,
              }),
            )
            // Navigates to first screen in stack
            router.dismissAll()
            // closes first screen in stack
            router.back()
            // closes the "my accounts" screen modal
            router.back()
          }}
        >
          Continue
        </SafeButton>
      </View>
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
