import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { makeSafeId } from '@/src/utils/formatters'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { isValidAddress } from '@safe-global/utils/validation'
import { parsePrefixedAddress } from '@safe-global/utils/addresses'
import { ImportAccountFormView } from '@/src/features/ImportReadOnly/components/ImportAccountFormView'

export const ImportAccountFormContainer = () => {
  const params = useLocalSearchParams<{ safeAddress: string }>()
  const [safeAddress, setSafeAddress] = useState(params.safeAddress || '')
  const chainIds = useAppSelector(selectAllChainsIds)
  const router = useRouter()
  const [isEnteredAddressValid, setEnteredAddressValid] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [addressWithoutPrefix, setAddressWithoutPrefix] = useState<string | undefined>(undefined)

  const [trigger, result] = useLazySafesGetOverviewForManyQuery()

  const safeExists = (result.data && result.data.length > 0) || false

  const onChangeText = useCallback(
    (text: string) => {
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
    },
    [chainIds, trigger],
  )

  useEffect(() => {
    if (params.safeAddress) {
      onChangeText(params.safeAddress)
    }
  }, [params.safeAddress, onChangeText])

  const canContinue = isEnteredAddressValid && safeExists && !error

  const handleContinue = useCallback(() => {
    router.push(
      `/(import-accounts)/signers?safeAddress=${addressWithoutPrefix}&chainId=${result.data?.[0].chainId}&import_safe=true`,
    )
  }, [addressWithoutPrefix, result.data, router])

  return (
    <ImportAccountFormView
      safeAddress={safeAddress}
      onChangeText={onChangeText}
      error={error}
      canContinue={canContinue}
      addressWithoutPrefix={addressWithoutPrefix}
      result={result}
      isEnteredAddressValid={isEnteredAddressValid}
      safeExists={safeExists}
      onContinue={handleContinue}
    />
  )
}
