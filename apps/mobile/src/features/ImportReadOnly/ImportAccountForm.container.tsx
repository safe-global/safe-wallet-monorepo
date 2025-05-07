import { useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { ImportAccountFormView } from '@/src/features/ImportReadOnly/components/ImportAccountFormView'
import { useFormContext } from 'react-hook-form'

export const ImportAccountFormContainer = () => {
  const router = useRouter()
  const { getFieldState, getValues } = useFormContext()

  const addressState = getFieldState('safeAddress')

  const handleContinue = useCallback(() => {
    const inputAddress = getValues('safeAddress')
    const chainId = getValues('chainId')
    const safeName = getValues('name')
    const { address } = parsePrefixedAddress(inputAddress)

    router.push(
      `/(import-accounts)/signers?safeAddress=${address}&chainId=${chainId}&import_safe=true&safeName=${safeName}`,
    )
  }, [router, getValues])

  return (
    <ImportAccountFormView
      isEnteredAddressValid={addressState.isTouched && !addressState.invalid}
      onContinue={handleContinue}
    />
  )
}
