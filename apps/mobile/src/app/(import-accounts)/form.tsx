import React from 'react'
import { ImportAccountFormContainer } from '@/src/features/ImportReadOnly'
import { View } from 'tamagui'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema } from '@/src/features/ImportReadOnly/schema'
import { useLocalSearchParams } from 'expo-router'

function ImportAccountFormScreen() {
  const params = useLocalSearchParams<{ safeAddress: string }>()
  const methods = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      safeAddress: params.safeAddress || '',
    },
  })

  return (
    <View style={{ flex: 1 }}>
      <FormProvider {...methods}>
        <ImportAccountFormContainer />
      </FormProvider>
    </View>
  )
}

export default ImportAccountFormScreen
