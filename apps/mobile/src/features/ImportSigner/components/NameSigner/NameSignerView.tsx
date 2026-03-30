import React from 'react'
import { KeyboardAvoidingView, Pressable, StyleSheet } from 'react-native'
import { ScrollView, Text, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { Identicon } from '@/src/components/Identicon'
import { SafeInput } from '@/src/components/SafeInput'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SectionTitle } from '@/src/components/Title'
import { type Address } from '@/src/types/address'
import { type FormValues } from '@/src/features/Signer/types'

const CUSTOM_VERTICAL_OFFSET = 70

type Props = {
  address: Address
  truncatedAddress: string
  control: Control<FormValues>
  errors: FieldErrors<FormValues>
  isValid: boolean
  isLoading: boolean
  onContinue: () => void
  onClear: () => void
}

export function NameSignerView({
  address,
  truncatedAddress,
  control,
  errors,
  isValid,
  isLoading,
  onContinue,
  onClear,
}: Props) {
  const { top } = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex1} keyboardVerticalOffset={top + CUSTOM_VERTICAL_OFFSET}>
      <ScrollView flex={1}>
        <View marginTop="$2">
          <SectionTitle
            paddingHorizontal={0}
            title="Name your signer"
            description={`You are connecting ${truncatedAddress}.\nChoose a name for your new signer, you can change it later.`}
          />
        </View>

        <View marginTop="$6">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <SafeInput
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter signer name"
                error={!!errors.name}
                testID="name-signer-input"
                left={<Identicon address={address} size={40} />}
                right={
                  value ? (
                    <Pressable onPress={onClear} hitSlop={12} testID="clear-name-button">
                      <SafeFontIcon name="close" size={16} color="$colorSecondary" />
                    </Pressable>
                  ) : null
                }
              />
            )}
          />

          {errors.name && (
            <Text color="$error" fontSize="$3">
              {errors.name.message}
            </Text>
          )}

          <Text fontSize="$3" color="$colorSecondary">
            Only visible to you.
          </Text>
        </View>
      </ScrollView>

      <SafeButton onPress={onContinue} disabled={!isValid || isLoading} testID="name-signer-continue">
        Continue
      </SafeButton>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
})
