import React from 'react'
import { Text, View } from 'tamagui'
import { SafeInputWithLabel } from '@/src/components/SafeInput/SafeInputWithLabel'
import { Controller, Control, FieldErrors } from 'react-hook-form'
import { ContactFormData } from '../schemas'
import { type Contact } from '@/src/store/addressBookSlice'

interface ContactNameFieldProps {
  isEditing: boolean
  contact?: Contact | null
  control?: Control<ContactFormData>
  errors?: FieldErrors<ContactFormData>
  dirtyFields?: Partial<Record<keyof ContactFormData, boolean>>
}

export const ContactNameField = ({ isEditing, contact, control, errors, dirtyFields }: ContactNameFieldProps) => {
  const isNew = !contact?.value

  if (isEditing && control) {
    return (
      <View>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <SafeInputWithLabel
              label="Name"
              value={value}
              autoFocus
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={isNew ? 'Enter name' : contact?.name || 'Enter name'}
              error={dirtyFields?.name && !!errors?.name}
              success={dirtyFields?.name && !errors?.name && value.trim().length > 0}
            />
          )}
        />
        {errors?.name && <Text color="$error">{errors.name.message}</Text>}
      </View>
    )
  }

  return <SafeInputWithLabel label="Name" value={contact?.name || 'Unnamed contact'} disabled editable={false} />
}
