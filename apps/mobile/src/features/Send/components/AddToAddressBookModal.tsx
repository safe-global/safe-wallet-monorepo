import React, { useState } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { Text, useTheme } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { useAppDispatch } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { upsertContact } from '@/src/store/addressBookSlice'
import { shortenAddress } from '@/src/utils/formatters'
import type { Address } from '@/src/types/address'
import { DialogModal } from './DialogModal'

interface AddToAddressBookModalProps {
  visible: boolean
  address: string
  onClose: () => void
  onSaved: () => void
}

export function AddToAddressBookModal({ visible, address, onClose, onSaved }: AddToAddressBookModalProps) {
  const theme = useTheme()
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
    <DialogModal visible={visible} onCancel={handleCancel} onSave={handleSave} saveDisabled={!name.trim()}>
      <Identicon address={address as Address} size={90} rounded />

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        placeholderTextColor={String(theme.colorSecondary.get())}
        style={[styles.nameInput, { color: String(theme.color.get()) }]}
        cursorColor={String(theme.color.get())}
        testID="contact-name-input"
      />

      <Text fontSize={16} color="$colorSecondary" textAlign="center">
        {shortenAddress(address, 4)}
      </Text>
    </DialogModal>
  )
}

const styles = StyleSheet.create({
  nameInput: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
    width: '100%',
  },
})
