import React from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { LargeHeaderTitle } from '@/src/components/Title/LargeHeaderTitle'
import { SafeInput } from '@/src/components/SafeInput/SafeInput'
import { SafeButton } from '@/src/components/SafeButton'
import { VerificationStatus } from '@/src/features/ImportReadOnly/components/VerificationStatus'
import { View, Text, ScrollView, YStack, getTokenValue } from 'tamagui'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Controller, useFormContext } from 'react-hook-form'
import type { FormValues } from '@/src/features/ImportReadOnly/types'
import SafeAccountInput from '@/src/components/SafeAccountInput'

type ImportAccountFormViewProps = {
  isEnteredAddressValid: boolean
  onContinue: () => void
}

export const ImportAccountFormView: React.FC<ImportAccountFormViewProps> = ({ isEnteredAddressValid, onContinue }) => {
  const {
    control,
    formState: { errors, isValid, dirtyFields },
    watch,
  } = useFormContext<FormValues>()
  const { top, bottom } = useSafeAreaInsets()
  const result = watch('importedSafeResult')

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>Import Safe account</NavBarTitle>,
  })

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={bottom + top}>
      <YStack flex={1}>
        <ScrollView
          paddingBottom={'$4'}
          onScroll={handleScroll}
          flex={1}
          contentContainerStyle={{ paddingBottom: '$4', paddingHorizontal: '$4' }}
        >
          <LargeHeaderTitle marginBottom={'$4'}>Import Safe account</LargeHeaderTitle>
          <Text>Paste the address of an account you want to import.</Text>
          <View marginTop={'$4'}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => {
                return (
                  <SafeInput
                    value={value}
                    onChangeText={onChange}
                    multiline={true}
                    autoFocus={true}
                    placeholder="Enter safe name here"
                    error={errors.name?.message}
                    success={dirtyFields.name && !errors.name}
                  />
                )
              }}
            />
          </View>

          <View marginTop={'$4'}>
            <SafeAccountInput />
          </View>

          {!errors.safeAddress && (
            <VerificationStatus
              isLoading={result?.isFetching}
              data={result?.data}
              isEnteredAddressValid={isEnteredAddressValid}
            />
          )}
        </ScrollView>

        <View paddingHorizontal={'$4'} paddingTop={'$2'} paddingBottom={bottom || getTokenValue('$4')}>
          <SafeButton
            primary
            onPress={onContinue}
            disabled={!isValid || result?.isFetching || !result?.data?.length}
            testID={'continue-button'}
          >
            Continue
          </SafeButton>
        </View>
      </YStack>
    </KeyboardAvoidingView>
  )
}
