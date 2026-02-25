import React, { useCallback, useRef, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput } from 'react-native'
import { BlurView } from 'expo-blur'
import { Text, View } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { useAppDispatch } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { upsertContact } from '@/src/store/addressBookSlice'
import { shortenAddress } from '@/src/utils/formatters'
import type { Address } from '@/src/types/address'

interface AddToAddressBookModalProps {
  visible: boolean
  address: string
  onClose: () => void
  onSaved: () => void
}

export function AddToAddressBookModal({ visible, address, onClose, onSaved }: AddToAddressBookModalProps) {
  const [name, setName] = useState('')
  const inputRef = useRef<TextInput>(null)
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()

  const handleModalShow = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleSave = () => {
    if (!name.trim()) {
      return
    }

    dispatch(
      upsertContact({
        value: address,
        name: name.trim(),
        chainIds: [activeSafe.chainId],
      }),
    )

    setName('')
    onSaved()
  }

  const handleCancel = () => {
    setName('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onShow={handleModalShow}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={styles.backdrop} />
        ) : (
          <View style={styles.backdropAndroid} />
        )}
        <View flex={1} justifyContent="center" alignItems="center">
          <View
            backgroundColor="$backgroundPaper"
            borderRadius={16}
            paddingHorizontal="$6"
            paddingTop="$6"
            paddingBottom="$4"
            width="75%"
            alignItems="center"
            gap="$3"
          >
            <Identicon address={address as Address} size={48} rounded />

            <TextInput
              ref={inputRef}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.nameInput}
              cursorColor="white"
              testID="contact-name-input"
            />

            <Text fontSize="$4" color="$colorSecondary">
              {shortenAddress(address, 4)}
            </Text>

            <Pressable onPress={handleSave} disabled={!name.trim()} testID="save-address-button">
              <Text
                fontSize="$4"
                fontWeight={600}
                color={name.trim() ? '$success' : '$colorDisabled'}
                paddingVertical="$2"
              >
                Save address
              </Text>
            </Pressable>

            <Pressable onPress={handleCancel} testID="cancel-button">
              <Text fontSize="$4" color="$color" paddingVertical="$2">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropAndroid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  nameInput: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    padding: 0,
    width: '100%',
  },
})
