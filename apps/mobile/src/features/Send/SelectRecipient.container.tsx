import React, { useCallback, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { View, getTokenValue } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeButton } from '@/src/components/SafeButton'
import { RecipientInput } from './components/RecipientInput'
import { RecipientSections } from './components/RecipientSections'
import { AddToAddressBookModal } from './components/AddToAddressBookModal'
import { useRecipientValidation } from './hooks/useRecipientValidation'
import { useRecipientSearch } from './hooks/useRecipientSearch'

export function SelectRecipientContainer() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const [address, setAddress] = useState('')
  const [recipientName, setRecipientName] = useState<string>()
  const [showAddContact, setShowAddContact] = useState(false)

  const validation = useRecipientValidation(address)
  const searchResults = useRecipientSearch(address)

  const handleAddressChange = useCallback((text: string) => {
    setAddress(text)
    setRecipientName(undefined)
  }, [])

  const handleSelect = useCallback((selectedAddress: string, name?: string) => {
    setAddress(selectedAddress)
    setRecipientName(name)
  }, [])

  const handleQrPress = useCallback(() => {
    // TODO: Integrate QR scanner via existing QrCamera component
  }, [])

  const handleContinue = useCallback(() => {
    if (!validation.canContinue) {
      return
    }

    router.push({
      pathname: '/(send)/token',
      params: {
        recipientAddress: address.trim(),
        ...(recipientName ? { recipientName } : {}),
      },
    })
  }, [address, recipientName, validation.canContinue, router])

  const handleContactSaved = useCallback(() => {
    setShowAddContact(false)
  }, [])

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View flex={1}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: getTokenValue('$4') }}>
          <View gap="$4">
            <RecipientInput
              value={address}
              onChangeText={handleAddressChange}
              onQrPress={handleQrPress}
              validationState={validation.state}
              contactName={validation.contactName}
            />

            {validation.state === 'unknown' && (
              <SafeButton
                secondary
                primary={false}
                onPress={() => setShowAddContact(true)}
                testID="add-to-address-book"
              >
                Add to address book
              </SafeButton>
            )}

            <RecipientSections
              safes={searchResults.safes}
              signers={searchResults.signers}
              addressBook={searchResults.addressBook}
              onSelect={handleSelect}
            />
          </View>
        </ScrollView>

        <View
          paddingHorizontal="$4"
          paddingTop="$3"
          paddingBottom={Math.max(bottom, getTokenValue('$4'))}
          borderTopWidth={1}
          borderTopColor="$borderLight"
        >
          <SafeButton onPress={handleContinue} disabled={!validation.canContinue} testID="continue-button">
            Continue
          </SafeButton>
        </View>
      </View>

      <AddToAddressBookModal
        visible={showAddContact}
        address={address}
        onClose={() => setShowAddContact(false)}
        onSaved={handleContactSaved}
      />
    </KeyboardAvoidingView>
  )
}
