import { useEffect, useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import { makeSafeId } from '@/src/utils/formatters'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChainsIds } from '@/src/store/chains'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { FormValues } from '@/src/features/ImportReadOnly/types'
import debounce from 'lodash/debounce'
import { selectCurrency } from '@/src/store/settingsSlice'

const NO_SAFE_DEPLOYMENT_ERROR = 'No Safe deployment found for this address'

export const useImportSafe = () => {
  const chainIds = useAppSelector(selectAllChainsIds)
  const currency = useAppSelector(selectCurrency)
  const {
    watch,
    getFieldState,
    setValue,
    setError,
    clearErrors,
    getValues,
    trigger: triggerInput,
    formState: { isValid },
  } = useFormContext<FormValues>()
  const [trigger, result] = useLazySafesGetOverviewForManyQuery()

  const inputAddress = watch('safeAddress')

  const onSafeAddressChange = useCallback(
    debounce(() => {
      const { address } = parsePrefixedAddress(inputAddress)
      const isValid = isValidAddress(address)

      if (isValid) {
        trigger({
          safes: chainIds.map((chainId: string) => makeSafeId(chainId, address)),
          currency,
          trusted: true,
          excludeSpam: true,
        })
      } else {
        setValue('importedSafeResult', undefined)
      }
    }, 200),
    [chainIds, trigger, inputAddress, setValue],
  )

  useEffect(() => {
    onSafeAddressChange()
    return () => {
      onSafeAddressChange.cancel()
    }
  }, [onSafeAddressChange])

  useEffect(() => {
    const onResultChange = () => {
      setValue('importedSafeResult', {
        data: result?.data,
        isFetching: result?.isFetching,
        error: result?.error,
      })

      const addressState = getFieldState('safeAddress')

      if (!addressState.isDirty) {
        return
      }

      if (result?.data?.length === 0 && !result?.isLoading) {
        setError('safeAddress', { message: NO_SAFE_DEPLOYMENT_ERROR })
      } else if (addressState.invalid) {
        triggerInput('name')
        clearErrors('safeAddress')
      }
    }

    onResultChange()
  }, [result, setValue, setError, clearErrors, triggerInput])

  useEffect(() => {
    const importedSafeResult = getValues('importedSafeResult')

    if (importedSafeResult?.data?.length === 0 && !importedSafeResult?.isFetching) {
      setError('safeAddress', { message: NO_SAFE_DEPLOYMENT_ERROR })
    }
  }, [isValid, getValues])
}
