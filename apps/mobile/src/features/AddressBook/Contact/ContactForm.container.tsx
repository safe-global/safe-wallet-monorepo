import React, { useState } from 'react'
import { ScrollView, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAvoidingView } from 'react-native'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Contact } from '@/src/store/addressBookSlice'
import { contactSchema, type ContactFormData } from './schemas'
import {
  ContactActionButton,
  ContactAddressField,
  ContactHeader,
  ContactNameField,
  ContactNetworkRow,
} from '@/src/features/AddressBook/Contact/components'
import { NetworkSelector } from './NetworkSelector/NetworkSelector'

interface ContactFormProps {
  contact?: Contact | null
  isEditing: boolean
  onSave: (contact: Contact) => void
  onEdit?: () => void
}

export const ContactFormContainer = ({ contact, isEditing, onSave, onEdit }: ContactFormProps) => {
  const insets = useSafeAreaInsets()
  const [isNetworkSelectorVisible, setIsNetworkSelectorVisible] = useState(false)
  const [selectedChainIds, setSelectedChainIds] = useState<string[]>(contact?.chainIds || [])

  const methods = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: {
      name: contact?.name || '',
      address: contact?.value || '',
    },
  })

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid, dirtyFields },
  } = methods

  const watchedAddress = watch('address')
  const watchedName = watch('name')

  const onSubmit = (data: ContactFormData) => {
    onSave({
      value: data.address.trim(),
      name: data.name.trim(),
      logoUri: contact?.logoUri || null,
      chainIds: selectedChainIds,
    })
  }

  const displayName = isEditing ? watchedName || '' : contact?.name || ''
  const displayAddress = isEditing ? watchedAddress : contact?.value

  const handleNetworkPress = () => {
    setIsNetworkSelectorVisible(true)
  }

  const handleNetworkSelectionChange = (chainIds: string[]) => {
    setSelectedChainIds(chainIds)
  }

  const handleNetworkSelectorClose = () => {
    setIsNetworkSelectorVisible(false)
  }

  const content = (
    <View flex={1} style={{ marginBottom: insets.bottom }}>
      <ScrollView flex={1} keyboardShouldPersistTaps="handled">
        <ContactHeader displayAddress={displayAddress} displayName={displayName} />

        <View flex={1} paddingHorizontal="$4" gap="$4">
          <ContactNameField
            isEditing={isEditing}
            contact={contact}
            control={control}
            errors={errors}
            dirtyFields={dirtyFields}
          />

          <ContactNetworkRow onPress={handleNetworkPress} chainIds={selectedChainIds} />

          <ContactAddressField
            isEditing={isEditing}
            contact={contact}
            control={control}
            errors={errors}
            dirtyFields={dirtyFields}
          />
        </View>
      </ScrollView>
      <View paddingHorizontal="$4" paddingTop="$2">
        <ContactActionButton isEditing={isEditing} isValid={isValid} onEdit={onEdit} onSave={handleSubmit(onSubmit)} />
      </View>
      <NetworkSelector
        isVisible={isNetworkSelectorVisible}
        onClose={handleNetworkSelectorClose}
        onSelectionChange={handleNetworkSelectionChange}
        selectedChainIds={selectedChainIds}
        isReadOnly={!isEditing}
      />
    </View>
  )

  if (isEditing) {
    return (
      <FormProvider {...methods}>
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={insets.bottom + insets.top - 20}
        >
          {content}
        </KeyboardAvoidingView>
      </FormProvider>
    )
  }

  return content
}
