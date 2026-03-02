import React from 'react'
import { Modal, Pressable, StyleSheet } from 'react-native'
import { Text, View, useTheme } from 'tamagui'

interface DialogModalProps {
  visible: boolean
  title?: string
  onCancel: () => void
  onSave: () => void
  saveLabel?: string
  cancelLabel?: string
  saveDisabled?: boolean
  children: React.ReactNode
}

export function DialogModal({
  visible,
  title,
  onCancel,
  onSave,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  saveDisabled = false,
  children,
}: DialogModalProps) {
  const theme = useTheme()
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
            {title ? (
              <Text fontSize={16} fontWeight={700} color="$color" textAlign="center">
                {title}
              </Text>
            ) : null}

            {children}
          </View>

          <View>
            <View style={[styles.horizontalDivider, { backgroundColor: dividerColor }]} />
            <View flexDirection="row" alignItems="center" height={43}>
              <Pressable style={styles.buttonHalf} onPress={onCancel} testID="dialog-cancel">
                <Text fontSize={14} fontWeight={700} color="$color" textAlign="center">
                  {cancelLabel}
                </Text>
              </Pressable>

              <View style={[styles.verticalDivider, { backgroundColor: dividerColor }]} />

              <Pressable style={styles.buttonHalf} onPress={onSave} disabled={saveDisabled} testID="dialog-save">
                <Text
                  fontSize={14}
                  fontWeight={700}
                  color={saveDisabled ? '$colorSecondary' : '$success'}
                  textAlign="center"
                >
                  {saveLabel}
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
