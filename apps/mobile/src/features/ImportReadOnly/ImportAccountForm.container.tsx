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
    setError,
    watch,
    clearErrors,
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

  const [trigger, { data, isLoading, isError }] = useLazySafesGetOverviewForManyQuery()

  const safeExists = (data && data.length > 0) || false
  const inputAddress = watch('safeAddress')

  useEffect(() => {
    if (!addressState.invalid && addressState.isDirty) {
      const { address } = parsePrefixedAddress(inputAddress)
      const isValid = isValidAddress(address)

      if (isValid) {
        trigger({
          safes: chainIds.map((chainId: string) => makeSafeId(chainId, address)),
          currency: 'usd',
          trusted: true,
          excludeSpam: true,
        })
      } else {
        setError('safeAddress', { message: 'Invalid address' })
      }
    }
  }, [chainIds, trigger, setError, clearErrors, inputAddress, addressState.isDirty, addressState.invalid])

  useEffect(() => {
    const validateSafe = () => {
      const { address } = parsePrefixedAddress(inputAddress)
      const isValid = isValidAddress(address)

      if (!addressState.isDirty || !isValid) {
        return
      }

      if ((isError || !data?.length) && !isLoading) {
        setError('safeAddress', { message: 'Safe not found' })
      } else {
        clearErrors('safeAddress')
      }
    }

    const debouncedValidation = setTimeout(validateSafe, 300)

    return () => clearTimeout(debouncedValidation)
  }, [isError, data, addressState.isDirty, isLoading, clearErrors, setError, inputAddress, addressState.invalid])

  const canContinue = isValid && safeExists && !isLoading

  const handleContinue = useCallback(() => {
    const inputAddress = getValues('safeAddress')
    const { address } = parsePrefixedAddress(inputAddress)
    router.push(
      `/(import-accounts)/signers?safeAddress=${address}&chainId=${data?.[0].chainId}&import_safe=true&safeName=${getValues('name')}`,
    )
  }, [data, router])

  return (
    <ImportAccountFormView
      canContinue={canContinue}
      isLoading={isLoading}
      data={data}
      isEnteredAddressValid={addressState.isTouched && !addressState.invalid}
      onContinue={handleContinue}
      control={control}
      errors={errors}
      dirtyFields={dirtyFields}
      isFormValid={isValid}
    />
  )
}
