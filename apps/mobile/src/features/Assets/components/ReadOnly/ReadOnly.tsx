import { Container } from '@/src/components/Container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { DimensionValue, Pressable } from 'react-native'
import { View, Text } from 'tamagui'
import { ReadOnlyWarningModal } from '@/src/components/ReadOnlyWarningModal'
import { ReadOnlyIconBlock } from './ReadOnlyIconBlock'

export interface ReadOnlyProps {
  signers: string[]
  marginBottom?: DimensionValue | string
  marginTop?: DimensionValue | string
  isDismissed: boolean
  onAddSigner: () => void
  onDismiss: () => void
}

export const ReadOnly = ({
  signers,
  marginBottom = '$6',
  marginTop = '$2',
  isDismissed,
  onAddSigner,
  onDismiss,
}: ReadOnlyProps) => {
  if (signers.length === 0 && !isDismissed) {
    return (
      <ReadOnlyWarningModal onAddSigner={onAddSigner}>
        <Container
          marginBottom={marginBottom}
          marginTop={marginTop}
          paddingVertical="$3"
          paddingHorizontal="$4"
          backgroundColor="$backgroundSecondary"
          borderRadius="$6"
        >
          <View flexDirection="row" alignItems="center" justifyContent="space-between">
            <View flexDirection="row" alignItems="center" gap="$3" flex={1}>
              <ReadOnlyIconBlock />
              <View flex={1} gap="$0">
                <Text fontSize="$4" fontWeight={700} lineHeight={18} letterSpacing={0.1}>
                  Read-only mode
                </Text>
                <Text color="$colorSecondary" fontSize="$4" lineHeight={18} letterSpacing={0.1}>
                  To sign transactions, add a signer.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation()
                onDismiss()
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0, padding: 4 }]}
            >
              <SafeFontIcon name="close" size={16} color="$borderMain" />
            </Pressable>
          </View>
        </Container>
      </ReadOnlyWarningModal>
    )
  }

  return null
}
