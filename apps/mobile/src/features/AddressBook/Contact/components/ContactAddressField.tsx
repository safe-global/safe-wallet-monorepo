import React from 'react'
import { Text, View } from 'tamagui'
import { SafeInputWithLabel } from '@/src/components/SafeInput/SafeInputWithLabel'
import { Controller, Control, FieldErrors } from 'react-hook-form'
import { ContactFormData } from '../schemas'
import { type Contact } from '@/src/store/addressBookSlice'

interface ContactAddressFieldProps {
  isEditing: boolean
  contact?: Contact | null
  control?: Control<ContactFormData>
  errors?: FieldErrors<ContactFormData>
  dirtyFields?: Partial<Record<keyof ContactFormData, boolean>>
}

export const ContactAddressField = ({ isEditing, contact, control, errors, dirtyFields }: ContactAddressFieldProps) => {
  if (isEditing && control) {
    return (
      <View>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <SafeInputWithLabel
              label="Address"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter address"
              autoCapitalize="none"
              autoCorrect={false}
              error={dirtyFields?.address && !!errors?.address}
              success={dirtyFields?.address && !errors?.address && value.trim().length > 0}
              multiline
              numberOfLines={3}
            />
          )}
        />
        {errors?.address && <Text color="$error">{errors.address.message}</Text>}
      </View>
    )
  }

  return (
    <SafeInputWithLabel
      label="Address"
      value={contact?.value || ''}
      disabled
      editable={false}
      multiline
      numberOfLines={3}
    />
  )
}
