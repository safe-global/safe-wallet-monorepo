import React, { useCallback, useEffect, useState } from 'react'
import { TextInput, StyleSheet } from 'react-native'
import { Text, useTheme } from 'tamagui'
import { DialogModal } from './DialogModal'

interface CustomNonceModalProps {
  visible: boolean
  defaultNonce: string
  currentNonce: number
  onSave: (nonce: number) => void
  onCancel: () => void
}

function isNonceInRange(parsed: number, currentNonce: number): boolean {
  return !Number.isNaN(parsed) && parsed >= currentNonce && parsed <= Number.MAX_SAFE_INTEGER
}

function validateNonce(value: string, currentNonce: number): string | undefined {
  if (value.length === 0) {
    return undefined
  }

  const parsed = parseInt(value, 10)

  if (Number.isNaN(parsed)) {
    return undefined
  }

  if (parsed > Number.MAX_SAFE_INTEGER) {
    return 'Nonce is too large'
  }

  if (parsed < currentNonce) {
    return `Nonce must be >= ${currentNonce}`
  }

  return undefined
}

export function CustomNonceModal({ visible, defaultNonce, currentNonce, onSave, onCancel }: CustomNonceModalProps) {
  const theme = useTheme()
  const [value, setValue] = useState(defaultNonce)

  useEffect(() => {
    if (visible) {
      setValue(defaultNonce)
    }
  }, [visible, defaultNonce])

  const handleSave = useCallback(() => {
    const parsed = parseInt(value, 10)
    if (isNonceInRange(parsed, currentNonce)) {
      onSave(parsed)
    }
  }, [value, currentNonce, onSave])

  const handleChangeText = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '')
    setValue(cleaned)
  }, [])

  const error = validateNonce(value, currentNonce)
  const parsed = parseInt(value, 10)
  const isValid = value.length > 0 && !Number.isNaN(parsed) && !error

  return (
    <DialogModal visible={visible} title="New nonce" onCancel={onCancel} onSave={handleSave} saveDisabled={!isValid}>
      <TextInput
        style={[styles.input, { color: String(theme.color.get()) }]}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        autoFocus
        selectTextOnFocus
        testID="custom-nonce-input"
      />

      {error && (
        <Text fontSize={12} color="$error" textAlign="center" testID="custom-nonce-error">
          {error}
        </Text>
      )}
    </DialogModal>
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 8,
  },
})
