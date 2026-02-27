import React, { useCallback, useState } from 'react'
import { Modal, TextInput, Pressable, StyleSheet } from 'react-native'
import { Text, View, useTheme } from 'tamagui'

interface CustomNonceModalProps {
  visible: boolean
  defaultNonce: string
  onSave: (nonce: number) => void
  onCancel: () => void
}

export function CustomNonceModal({ visible, defaultNonce, onSave, onCancel }: CustomNonceModalProps) {
  const theme = useTheme()
  const [value, setValue] = useState(defaultNonce)

  const handleSave = useCallback(() => {
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onSave(parsed)
    }
  }, [value, onSave])

  const handleChangeText = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '')
    setValue(cleaned)
  }, [])

  const isValid = value.length > 0 && !Number.isNaN(parseInt(value, 10))
  const dividerColor = String(theme.borderLight.get())

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[
            styles.container,
            {
              backgroundColor: String(theme.backgroundPaper.get()),
              borderColor: dividerColor,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View alignItems="center" gap="$4" paddingVertical="$4">
            <Text fontSize={16} fontWeight={700} color="$color" textAlign="center">
              New nonce
            </Text>

            <TextInput
              style={[styles.input, { color: String(theme.color.get()) }]}
              value={value}
              onChangeText={handleChangeText}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              testID="custom-nonce-input"
            />
          </View>

          <View>
            <View style={[styles.horizontalDivider, { backgroundColor: dividerColor }]} />
            <View flexDirection="row" alignItems="center" height={43}>
              <Pressable style={styles.buttonHalf} onPress={onCancel} testID="custom-nonce-cancel">
                <Text fontSize={14} fontWeight={700} color="$color" textAlign="center">
                  Cancel
                </Text>
              </Pressable>

              <View style={[styles.verticalDivider, { backgroundColor: dividerColor }]} />

              <Pressable
                style={styles.buttonHalf}
                onPress={handleSave}
                disabled={!isValid}
                testID="custom-nonce-save"
              >
                <Text
                  fontSize={14}
                  fontWeight={700}
                  color={isValid ? '$success' : '$colorSecondary'}
                  textAlign="center"
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 256,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 16,
    gap: 16,
    overflow: 'hidden',
  },
  input: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 8,
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
