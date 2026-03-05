import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { DimensionValue, Pressable } from 'react-native'
import { View, Text } from 'tamagui'
import { ReadOnlyWarningModal } from '@/src/components/ReadOnlyWarningModal'

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
        <View
          marginBottom={marginBottom}
          marginTop={marginTop}
          backgroundColor="$backgroundSecondary"
          borderRadius={8}
          height={64}
          paddingHorizontal="$3"
          flexDirection="row"
          alignItems="center"
          gap="$3"
        >
          <SafeFontIcon name="eye-n" color="$color" size={24} />
          <View flex={1}>
            <Text fontSize="$4" fontWeight={600} lineHeight={20} letterSpacing={0.15}>
              You are in read-only mode
            </Text>
            <Text color="$colorSecondary" fontSize="$4" lineHeight={20} letterSpacing={0.1}>
              To sign transactions, add a signer.
            </Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              onDismiss()
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0, padding: 4 }]}
          >
            <SafeFontIcon name="close" size={24} color="$borderMain" />
          </Pressable>
        </View>
      </ReadOnlyWarningModal>
    )
  }

  return null
}
