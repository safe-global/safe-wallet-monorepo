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
import { useSafeAreaPaddingBottom } from '@/src/theme/hooks/useSafeAreaPaddingBottom'

type LazyQueryResult = ReturnType<typeof useLazySafesGetOverviewForManyQuery>[1]

type ImportAccountFormViewProps = {
  safeAddress: string
  onChangeText: (text: string) => void
  error: string | undefined
  canContinue: boolean
  addressWithoutPrefix: string | undefined
  result: LazyQueryResult
  isEnteredAddressValid: boolean
  safeExists: boolean
  onContinue: () => void
}

const ADJUSTMENT_FOR_KEYBOARD = 20

export const ImportAccountFormView: React.FC<ImportAccountFormViewProps> = ({
  safeAddress,
  onChangeText,
  error,
  canContinue,
  addressWithoutPrefix,
  result,
  isEnteredAddressValid,
  safeExists,
  onContinue,
}) => {
  const paddingBottom = useSafeAreaPaddingBottom()
  const { handleScroll } = useScrollableHeader({
    children: (
      <>
        <NavBarTitle paddingRight={5}>Import Safe account</NavBarTitle>
      </>
    ),
  })

  return (
    <View flex={1} paddingBottom={paddingBottom} paddingHorizontal={'$6'}>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={paddingBottom + ADJUSTMENT_FOR_KEYBOARD}
      >
        <ScrollView paddingBottom={'$4'} onScroll={handleScroll} flex={1}>
          <LargeHeaderTitle marginBottom={'$4'}>Import Safe account</LargeHeaderTitle>
          <Text marginBottom={'$4'}>Paste the address of an account you want to import.</Text>
          <SafeInput
            value={safeAddress}
            onChangeText={onChangeText}
            multiline={true}
            placeholder="Paste address..."
            error={error && error.length > 0 ? error : undefined}
            success={canContinue}
            left={
              addressWithoutPrefix ? (
                <Identicon address={addressWithoutPrefix as `0x${string}`} size={32} />
              ) : (
                <View width={32} />
              )
            }
            right={
              result?.data?.length && !error ? (
                <SafeFontIcon name={'check-filled'} size={20} color={'$success'} testID={'success-icon'} />
              ) : (
                <View width={20} />
              )
            }
          />

          <VerificationStatus
            isLoading={result.isLoading}
            data={result.data}
            isEnteredAddressValid={isEnteredAddressValid}
          />
        </ScrollView>
        <SafeButton
          primary
          onPress={onContinue}
          disabled={!isEnteredAddressValid || !safeExists}
          testID={'continue-button'}
        >
          Continue
        </SafeButton>
      </KeyboardAvoidingView>
    </View>
  )
}
