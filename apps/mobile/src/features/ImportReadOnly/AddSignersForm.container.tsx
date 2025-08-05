import { useLocalSearchParams, useNavigation } from 'expo-router'
import { CommonActions } from '@react-navigation/native'
import React, { useMemo } from 'react'
import { makeSafeId } from '@/src/utils/formatters'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useSafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { Address } from '@/src/types/address'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { groupSigners } from '@/src/features/Signers/hooks/useSignersGroupService'
import { selectSigners } from '@/src/store/signersSlice'
import { SignerSection } from '@/src/features/Signers/components/SignersList/SignersList'
import { extractSignersFromSafes } from '@/src/features/ImportReadOnly/helpers/safes'
import { AddSignersFormView } from '@/src/features/ImportReadOnly/components/AddSignersFormView'
import { upsertContact } from '@/src/store/addressBookSlice'
import { selectCurrency } from '@/src/store/settingsSlice'

export const AddSignersFormContainer = () => {
  const params = useLocalSearchParams<{ safeAddress: string; safeName: string }>()
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  const chainIds = useAppSelector(selectAllChainsIds)
  const appSigners = useAppSelector(selectSigners)
  const currency = useAppSelector(selectCurrency)
  const { currentData, isFetching } = useSafesGetOverviewForManyQuery({
    safes: chainIds.map((chainId: string) => makeSafeId(chainId, params.safeAddress)),
    currency,
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
    dispatch(upsertContact({ value: params.safeAddress, name: params.safeName, chainIds: [] }))
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

    navigation.dispatch(
      CommonActions.reset({
        routes: [{ key: '(tabs)', name: '(tabs)' }],
      }),
    )
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
