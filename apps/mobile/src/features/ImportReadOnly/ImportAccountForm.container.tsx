import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { ImportAccountFormView } from '@/src/features/ImportReadOnly/components/ImportAccountFormView'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema } from './schema'
import { FormValues } from './types'

export const ImportAccountFormContainer = () => {
  const router = useRouter()
  const params = useLocalSearchParams<{ safeAddress: string }>()
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      safeAddress: params.safeAddress || '',
    },
  })

  const addressState = methods.getFieldState('safeAddress')

  const handleContinue = useCallback(() => {
    const inputAddress = methods.getValues('safeAddress')
    const chainId = methods.getValues('importedSafeResult.data.0.chainId')
    const safeName = methods.getValues('name')
    const { address } = parsePrefixedAddress(inputAddress)

    router.push(
      `/(import-accounts)/signers?safeAddress=${address}&chainId=${chainId}&import_safe=true&safeName=${safeName}`,
    )
  }, [router, methods.getValues])

  return (
    <FormProvider {...methods}>
      <ImportAccountFormView
        isEnteredAddressValid={addressState.isTouched && !addressState.invalid}
        onContinue={handleContinue}
      />
    </FormProvider>
  )
}
