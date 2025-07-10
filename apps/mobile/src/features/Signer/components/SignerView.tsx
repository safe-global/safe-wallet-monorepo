import { ScrollView, View, Text, H2, XStack, YStack } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { type Address } from '@/src/types/address'
import React from 'react'
import { Container } from '@/src/components/Container'
import { CopyButton } from '@/src/components/CopyButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { KeyboardAvoidingView, Pressable, TouchableOpacity } from 'react-native'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeInputWithLabel } from '@/src/components/SafeInput/SafeInputWithLabel'
import { Controller, FieldNamesMarkedBoolean, type Control, type FieldErrors } from 'react-hook-form'
import { type FormValues } from '@/src/features/Signer/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
type Props = {
  signerAddress: string
  onPressExplorer: () => void
  onPressDelete: () => void
  onPressEdit: () => void
  editMode: boolean
  name: string
  control: Control<FormValues>
  errors: FieldErrors<FormValues>
  dirtyFields: FieldNamesMarkedBoolean<FormValues>
}

export const SignerView = ({
  control,
  errors,
  dirtyFields,
  signerAddress,
  onPressDelete,
  onPressExplorer,
  onPressEdit,
  editMode,
  name,
}: Props) => {
  const { bottom, top } = useSafeAreaInsets()

  return (
    <YStack flex={1}>
      <ScrollView flex={1}>
        <View justifyContent={'center'} alignItems={'center'}>
          <Identicon address={signerAddress as Address} size={56} />
        </View>
        <View justifyContent={'center'} alignItems={'center'} marginTop={'$4'}>
          <H2 numberOfLines={1} maxWidth={300} marginTop={'$2'} textAlign={'center'}>
            {name || 'Unnamed signer'}
          </H2>
        </View>

        <View marginTop={'$4'}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => {
              return (
                <SafeInputWithLabel
                  label={'Name'}
                  value={editMode ? value : value || (!dirtyFields.name ? 'Unnamed signer' : '')}
                  onBlur={onBlur}
                  disabled={!editMode}
                  onChangeText={onChange}
                  placeholder={'Enter signer name'}
                  error={dirtyFields.name && !!errors.name}
                  success={dirtyFields.name && !errors.name}
                  right={
                    <TouchableOpacity onPress={onPressEdit} hitSlop={100}>
                      <SafeFontIcon name={editMode ? 'close' : 'edit'} color="$textSecondaryLight" size={16} />
                    </TouchableOpacity>
                  }
                />
              )
            }}
          />
          {errors.name && <Text color={'$error'}>{errors.name.message}</Text>}
        </View>

        <Container marginTop={'$4'} rowGap={'$1'}>
          <Text color={'$colorSecondary'}>Address</Text>
          <XStack columnGap={'$3'}>
            <Text flex={1}>{signerAddress}</Text>
            <YStack justifyContent={'flex-start'}>
              <XStack alignItems={'center'}>
                <CopyButton value={signerAddress} color={'$colorSecondary'} />
                <Pressable onPress={onPressExplorer}>
                  <SafeFontIcon name={'external-link'} size={14} color={'$colorSecondary'} />
                </Pressable>
              </XStack>
            </YStack>
          </XStack>
        </Container>
      </ScrollView>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={top + bottom}>
        <View paddingHorizontal={'$4'} paddingTop={'$2'} paddingBottom={bottom ?? 60}>
          {editMode ? (
            <SafeButton onPress={onPressEdit}>Save</SafeButton>
          ) : (
            <SafeButton danger={true} onPress={onPressDelete}>
              Remove signer
            </SafeButton>
          )}
        </View>
      </KeyboardAvoidingView>
    </YStack>
  )
}
