import React, { useCallback, useEffect, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native'
import { Text, View, getTokenValue } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { RecipientInput } from './components/RecipientInput'
import { RecipientSections } from './components/RecipientSections'
import { AddToAddressBookModal } from './components/AddToAddressBookModal'
import { useRecipientValidation } from './hooks/useRecipientValidation'
import { useRecipientSearch } from './hooks/useRecipientSearch'

export function SelectRecipientContainer() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const { scannedAddress } = useLocalSearchParams<{ scannedAddress?: string }>()
  const [address, setAddress] = useState('')
  const [recipientName, setRecipientName] = useState<string>()
  const [showAddContact, setShowAddContact] = useState(false)

  useEffect(() => {
    if (scannedAddress) {
      setAddress(scannedAddress)
      setRecipientName(undefined)
    }
  }, [scannedAddress])

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

  const handleClear = useCallback(() => {
    setAddress('')
    setRecipientName(undefined)
  }, [])

  const handleQrPress = useCallback(() => {
    router.push('/(send)/scan-qr')
  }, [router])

  const handleContinue = useCallback(() => {
    if (!validation.canContinue) {
      return
    }

    router.push({
      pathname: '/(send)/token',
      params: {
        recipientAddress: address.trim(),
        ...(displayName ? { recipientName: displayName } : {}),
      },
    })
  }, [address, recipientName, validation.canContinue, router])

  const handleContactSaved = useCallback(() => {
    setShowAddContact(false)
  }, [])

  const displayName = recipientName ?? validation.contactName
  const isSelected = !!displayName
  const hasAddress = validation.state !== 'empty' && validation.state !== 'typing'
  const showBrowseOptions = !isSelected && !hasAddress

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View flex={1}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={{ padding: getTokenValue('$4') }}
        >
          <View gap="$4">
            <RecipientInput
              value={address}
              onChangeText={handleAddressChange}
              onClear={handleClear}
              validationState={validation.state}
              contactName={validation.contactName}
              selectedName={displayName}
            />

            {!isSelected && validation.state === 'unknown' && (
              <Pressable onPress={() => setShowAddContact(true)} testID="add-to-address-book">
                <View flexDirection="row" alignItems="center" gap="$3" padding="$3">
                  <View
                    width={40}
                    height={40}
                    borderRadius={20}
                    backgroundColor="$backgroundSkeleton"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <SafeFontIcon name="plus" size={20} color="$color" />
                  </View>
                  <Text fontSize="$4" fontWeight={600} color="$color">
                    Add to address book
                  </Text>
                </View>
              </Pressable>
            )}

            {showBrowseOptions && (
              <>
                <Pressable onPress={handleQrPress} testID="scan-qr-button">
                  <View flexDirection="row" alignItems="center" gap="$3" padding="$3">
                    <View
                      width={40}
                      height={40}
                      borderRadius={20}
                      backgroundColor="$backgroundSkeleton"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <SafeFontIcon name="qr-code" size={20} color="$color" />
                    </View>
                    <Text fontSize="$4" fontWeight={600} color="$color">
                      Scan QR code
                    </Text>
                  </View>
                </Pressable>

                <RecipientSections
                  safes={searchResults.safes}
                  signers={searchResults.signers}
                  addressBook={searchResults.addressBook}
                  onSelect={handleSelect}
                />
              </>
            )}
          </View>
        </ScrollView>

        <View paddingHorizontal="$4" paddingTop="$3" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
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
