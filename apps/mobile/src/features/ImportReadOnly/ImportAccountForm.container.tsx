import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { ImportAccountFormView } from '@/src/features/ImportReadOnly/components/ImportAccountFormView'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema } from './schema'
import { FormValues } from './types'
import { useAppDispatch } from '@/src/store/hooks'
import { setPendingSafe } from '@/src/store/signerImportFlowSlice'

export const ImportAccountFormContainer = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
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
    const safeName = methods.getValues('name')
    const { address } = parsePrefixedAddress(inputAddress)

    dispatch(setPendingSafe({ address, name: safeName }))
    router.push(`/(import-accounts)/signers?safeAddress=${address}&safeName=${safeName}`)
  }, [router, methods.getValues, dispatch])

  return (
    <FormProvider {...methods}>
      <ImportAccountFormView
        isEnteredAddressValid={addressState.isTouched && !addressState.invalid}
        onContinue={handleContinue}
      />
    </FormProvider>
  )
}
