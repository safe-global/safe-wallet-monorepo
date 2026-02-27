import React, { useCallback, useRef, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput } from 'react-native'
import { BlurView } from 'expo-blur'
import { Text, View, useTheme } from 'tamagui'
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
  const theme = useTheme()
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

  const dividerColor = String(theme.borderLight.get())

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
            borderRadius={20}
            borderWidth={1}
            borderColor="$borderLight"
            width={256}
            paddingTop={16}
            gap={16}
            overflow="hidden"
          >
            <View alignItems="center" gap="$4" paddingVertical="$4">
              <Identicon address={address as Address} size={90} rounded />

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

              <Text fontSize={16} color="$colorSecondary" textAlign="center">
                {shortenAddress(address, 4)}
              </Text>
            </View>

            <View>
              <View style={[styles.horizontalDivider, { backgroundColor: dividerColor }]} />
              <View flexDirection="row" alignItems="center" height={43}>
                <Pressable style={styles.buttonHalf} onPress={handleCancel} testID="cancel-button">
                  <Text fontSize={14} fontWeight={700} color="$color" textAlign="center">
                    Cancel
                  </Text>
                </Pressable>

                <View style={[styles.verticalDivider, { backgroundColor: dividerColor }]} />

                <Pressable
                  style={styles.buttonHalf}
                  onPress={handleSave}
                  disabled={!name.trim()}
                  testID="save-address-button"
                >
                  <Text
                    fontSize={14}
                    fontWeight={700}
                    color={name.trim() ? '$success' : '$colorSecondary'}
                    textAlign="center"
                  >
                    Save
                  </Text>
                </Pressable>
              </View>
            </View>
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
  horizontalDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    height: '100%',
  },
  buttonHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
})
