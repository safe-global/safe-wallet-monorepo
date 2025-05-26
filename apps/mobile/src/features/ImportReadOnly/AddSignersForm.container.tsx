import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { makeSafeId } from '@/src/utils/formatters'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { addSafe } from '@/src/store/safesSlice'
import { selectActiveSafe, setActiveSafe } from '@/src/store/activeSafeSlice'
import { Address } from '@/src/types/address'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { groupSigners } from '@/src/features/Signers/hooks/useSignersGroupService'
import { selectSigners } from '@/src/store/signersSlice'
import { SignerSection } from '@/src/features/Signers/components/SignersList/SignersList'
import { extractSignersFromSafes } from '@/src/features/ImportReadOnly/helpers/safes'
import { AddSignersFormView } from '@/src/features/ImportReadOnly/components/AddSignersFormView'
import { upsertContact } from '@/src/store/addressBookSlice'

export const AddSignersFormContainer = () => {
  const params = useLocalSearchParams<{ safeAddress: string; safeName: string }>()
  const dispatch = useAppDispatch()
  const chainIds = useAppSelector(selectAllChainsIds)
  const appSigners = useAppSelector(selectSigners)
  const activeSafe = useAppSelector(selectActiveSafe)
  const { currentData, isFetching } = useSafesGetOverviewForManyQuery({
    safes: chainIds.map((chainId: string) => makeSafeId(chainId, params.safeAddress)),
    currency: 'usd',
    trusted: true,
    excludeSpam: true,
  })

  const signers = extractSignersFromSafes(currentData || [])
  const signersGroupedBySection = useMemo(() => groupSigners(Object.values(signers), appSigners), [signers, appSigners])

  const signersSections = Object.keys(signersGroupedBySection)
    .map((group) => {
      return signersGroupedBySection[group].data.length ? signersGroupedBySection[group] : null
    })
    .filter(Boolean) as SignerSection[]

  const handlePress = () => {
    if (!currentData) {
      return
    }
    const hasActiveSafe = !!activeSafe
    dispatch(upsertContact({ value: params.safeAddress, name: params.safeName }))
    const info = currentData.reduce<Record<string, SafeOverview>>((acc, safe) => {
      acc[safe.chainId] = safe
      return acc
    }, {})
    dispatch(addSafe({ address: currentData[0].address.value as Address, info }))
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
    if (!hasActiveSafe) {
      router.replace('/(tabs)')
    } else {
      // closes the "my accounts" screen modal
      router.back()
    }
  }

  return (
    <AddSignersFormView
      isFetching={isFetching}
      signersGroupedBySection={signersGroupedBySection}
      signersSections={signersSections}
      onPress={handlePress}
    />
  )
}
