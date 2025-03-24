import React from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { LargeHeaderTitle } from '@/src/components/Title/LargeHeaderTitle'
import { SafeInput } from '@/src/components/SafeInput/SafeInput'
import { Identicon } from '@/src/components/Identicon'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'
import { VerificationStatus } from '@/src/features/ImportReadOnly/components/VerificationStatus'
import { View, Text, ScrollView } from 'tamagui'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { useModalStyle } from '@/src/navigation/hooks/useModalStyle'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type Control, Controller, type FieldErrors, FieldNamesMarkedBoolean } from 'react-hook-form'
import type { FormValues } from '@/src/features/ImportReadOnly/types'
import { parsePrefixedAddress } from '@safe-global/utils/addresses'

type LazyQueryResult = ReturnType<typeof useLazySafesGetOverviewForManyQuery>[1]

type ImportAccountFormViewProps = {
  canContinue: boolean
  result: LazyQueryResult
  isEnteredAddressValid: boolean
  onContinue: () => void
  control: Control<FormValues>
  errors: FieldErrors<FormValues>
  dirtyFields: FieldNamesMarkedBoolean<FormValues>
  isFormValid: boolean
}

export const ImportAccountFormView: React.FC<ImportAccountFormViewProps> = ({
  canContinue,
  result,
  isEnteredAddressValid,
  onContinue,
  control,
  errors,
  dirtyFields,
}) => {
  const modalStyle = useModalStyle()
  const { top } = useSafeAreaInsets()

  const { handleScroll } = useScrollableHeader({
    children: (
      <>
        <NavBarTitle paddingRight={5}>Import Safe account</NavBarTitle>
      </>
    ),
  })

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
      keyboardVerticalOffset={modalStyle.paddingBottom + top}
    >
      <ScrollView
        paddingBottom={'$4'}
        onScroll={handleScroll}
        flex={1}
        contentContainerStyle={{ paddingBottom: '$9', paddingHorizontal: '$4' }}
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
          <Controller
            control={control}
            name="safeAddress"
            render={({ field: { onChange, value } }) => {
              const addressWithoutPrefix = parsePrefixedAddress(value).address
              return (
                <SafeInput
                  value={value}
                  onChangeText={onChange}
                  multiline={true}
                  placeholder="Paste address..."
                  error={errors.safeAddress?.message}
                  success={dirtyFields.safeAddress && !errors.safeAddress}
                  left={
                    addressWithoutPrefix ? (
                      <Identicon address={addressWithoutPrefix as `0x${string}`} size={32} />
                    ) : null
                  }
                  right={
                    result?.data?.length && !errors.safeAddress ? (
                      <SafeFontIcon name={'check-filled'} size={20} color={'$success'} testID={'success-icon'} />
                    ) : (
                      <View width={20} />
                    )
                  }
                />
              )
            }}
          />
        </View>

        {!errors.safeAddress && (
          <VerificationStatus
            isLoading={result.isLoading}
            data={result.data}
            isEnteredAddressValid={isEnteredAddressValid}
          />
        )}
      </ScrollView>
      <SafeButton
        primary
        onPress={onContinue}
        disabled={!canContinue}
        testID={'continue-button'}
        marginHorizontal={'$4'}
      >
        Continue
      </SafeButton>
    </KeyboardAvoidingView>
  )
}
