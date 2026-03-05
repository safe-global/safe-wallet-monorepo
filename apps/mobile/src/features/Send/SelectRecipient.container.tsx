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
import { SuspiciousAddressComparison } from './components/SuspiciousAddressComparison'
import { useRecipientValidation } from './hooks/useRecipientValidation'
import { useRecipientSearch } from './hooks/useRecipientSearch'
import { IconName } from '@/src/types/iconTypes'

function IconRow({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: IconName
  label: string
  onPress: () => void
  testID: string
}) {
  return (
    <Pressable onPress={onPress} testID={testID}>
      <View flexDirection="row" alignItems="center" gap="$3" paddingVertical="$3" paddingRight="$3">
        <View
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor="$backgroundSkeleton"
          alignItems="center"
          justifyContent="center"
        >
          <SafeFontIcon name={icon} size={24} color="$color" />
        </View>
        <Text fontSize="$5" color="$color">
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

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

  const displayName = recipientName ?? validation.contactName

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
  }, [address, displayName, validation.canContinue, router])

  const handleSuspiciousSelect = useCallback(
    (selectedAddress: string, name?: string) => {
      router.push({
        pathname: '/(send)/token',
        params: {
          recipientAddress: selectedAddress.trim(),
          ...(name ? { recipientName: name } : {}),
        },
      })
    },
    [router],
  )

  const handleContactSaved = useCallback(() => {
    setShowAddContact(false)
  }, [])
  const isSuspicious = validation.state === 'suspicious'
  const isSelected = !!displayName
  const hasAddress = validation.state !== 'empty' && validation.state !== 'typing'
  const showBrowseOptions = !isSelected && !hasAddress
  const showAddToAddressBook = !isSelected && validation.state === 'unknown'

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View flex={1}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={{
            paddingTop: getTokenValue('$6'),
            paddingBottom: getTokenValue('$4'),
            paddingHorizontal: getTokenValue('$4'),
          }}
        >
          {isSuspicious && validation.suspiciousMatch ? (
            <SuspiciousAddressComparison
              suspiciousAddress={address}
              knownAddress={validation.suspiciousMatch.knownAddress}
              knownName={validation.suspiciousMatch.knownName}
              onSelect={handleSuspiciousSelect}
            />
          ) : (
            <View gap="$2">
              <RecipientInput
                value={address}
                onChangeText={handleAddressChange}
                onClear={handleClear}
                validationState={validation.state}
                contactName={validation.contactName}
                selectedName={displayName}
              />

              {showAddToAddressBook && (
                <IconRow
                  icon="plus"
                  label="Add to address book"
                  onPress={() => setShowAddContact(true)}
                  testID="add-to-address-book"
                />
              )}

              {showBrowseOptions && (
                <>
                  <IconRow icon="qr-code" label="Scan QR code" onPress={handleQrPress} testID="scan-qr-button" />

                  <RecipientSections
                    safes={searchResults.safes}
                    signers={searchResults.signers}
                    addressBook={searchResults.addressBook}
                    onSelect={handleSelect}
                  />
                </>
              )}
            </View>
          )}
        </ScrollView>

        {!isSuspicious && (
          <View paddingHorizontal="$4" paddingTop="$3" paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
            <SafeButton onPress={handleContinue} disabled={!validation.canContinue} testID="continue-button">
              Continue
            </SafeButton>
          </View>
        )}
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
