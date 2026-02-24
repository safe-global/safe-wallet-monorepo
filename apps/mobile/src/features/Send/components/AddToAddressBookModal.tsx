import React, { useState } from 'react'
import { Modal } from 'react-native'
import { Input, Text, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
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
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()

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
    <Modal visible={visible} transparent animationType="fade">
      <View flex={1} justifyContent="center" alignItems="center" backgroundColor="rgba(0,0,0,0.5)">
        <View backgroundColor="$background" borderRadius="$4" padding="$4" width="85%" gap="$3">
          <Text fontSize="$5" fontWeight={600}>
            Add to address book
          </Text>

          <View flexDirection="row" alignItems="center" gap="$3">
            <Identicon address={address as Address} size={40} rounded />
            <Text fontSize="$3" color="$color">
              {shortenAddress(address, 8)}
            </Text>
          </View>

          <View gap="$2">
            <Text fontSize="$3" color="$colorSecondary">
              Name
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Enter contact name"
              autoFocus
              testID="contact-name-input"
            />
          </View>

          <View flexDirection="row" gap="$3" justifyContent="flex-end">
            <SafeButton onPress={handleCancel} secondary primary={false}>
              Cancel
            </SafeButton>
            <SafeButton onPress={handleSave} disabled={!name.trim()}>
              Save
            </SafeButton>
          </View>
        </View>
      </View>
    </Modal>
  )
}
