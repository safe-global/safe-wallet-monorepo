import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect } from 'react'
import { makeSafeId } from '@/src/utils/formatters'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { ImportAccountFormView } from '@/src/features/ImportReadOnly/components/ImportAccountFormView'
import { useForm } from 'react-hook-form'
import { FormValues } from '@/src/features/ImportReadOnly/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema } from '@/src/features/ImportReadOnly/schema'

export const ImportAccountFormContainer = () => {
  const params = useLocalSearchParams<{ safeAddress: string }>()
  const chainIds = useAppSelector(selectAllChainsIds)
  const router = useRouter()

  const {
    control,
    getValues,
    getFieldState,
    formState: { errors, dirtyFields, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      safeAddress: params.safeAddress || '',
    },
  })

  const addressState = getFieldState('safeAddress')

  const [trigger, result] = useLazySafesGetOverviewForManyQuery()

  const safeExists = (result.data && result.data.length > 0) || false

  useEffect(() => {
    if (!addressState.invalid) {
      const inputAddress = getValues('safeAddress')
      const { address } = parsePrefixedAddress(inputAddress)
      const isValid = isValidAddress(address)
      if (isValid) {
        trigger({
          safes: chainIds.map((chainId: string) => makeSafeId(chainId, address)),
          currency: 'usd',
          trusted: true,
          excludeSpam: true,
        })
      }
    }
  }, [chainIds, trigger, addressState.isDirty, addressState.invalid])

  const canContinue = isValid && safeExists

  const handleContinue = useCallback(() => {
    const inputAddress = getValues('safeAddress')
    const { address } = parsePrefixedAddress(inputAddress)
    router.push(
      `/(import-accounts)/signers?safeAddress=${address}&chainId=${result.data?.[0].chainId}&import_safe=true&safeName=${getValues('name')}`,
    )
  }, [result.data, router])

  return (
    <ImportAccountFormView
      canContinue={canContinue}
      result={result}
      isEnteredAddressValid={addressState.isTouched && !addressState.invalid}
      onContinue={handleContinue}
      control={control}
      errors={errors}
      dirtyFields={dirtyFields}
      isFormValid={isValid}
    />
  )
}
