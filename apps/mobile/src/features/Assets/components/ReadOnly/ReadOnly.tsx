import { Container } from '@/src/components/Container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { DimensionValue } from 'react-native'
import { View, Text } from 'tamagui'

export interface ReadOnlyProps {
  signers: string[]
  marginBottom?: DimensionValue | string
  marginTop?: DimensionValue | string
}

export const ReadOnly = ({ signers, marginBottom = '$6', marginTop = '$2' }: ReadOnlyProps) => {
  if (signers.length === 0) {
    return (
      <Container
        marginBottom={marginBottom}
        marginTop={marginTop}
        padding="$2"
        justifyContent="center"
        alignItems="center"
        backgroundColor="$backgroundSecondary"
      >
        <View flexDirection="row" alignItems="center" gap="$2">
          <SafeFontIcon name="eye-n" size={16} color="$colorLight" />
          <Text color="$colorLight" fontSize="$4" fontWeight={600} lineHeight={20} letterSpacing={-0.1}>
            This is a read-only account
          </Text>
        </View>
      </Container>
    )
  }

  return null
}
