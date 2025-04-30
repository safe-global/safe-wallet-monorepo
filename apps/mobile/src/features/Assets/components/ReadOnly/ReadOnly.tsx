import { Container } from '@/src/components/Container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { DimensionValue } from 'react-native'
import { View, Text } from 'tamagui'

export interface ReadOnlyProps {
  signers: string[]
  marginBottom?: DimensionValue | string
  marginTop?: DimensionValue | string
}

export const ReadOnly = ({ signers, marginBottom = '$8', marginTop = '$2' }: ReadOnlyProps) => {
  if (signers.length === 0) {
    return (
      <Container
        marginBottom={marginBottom}
        marginTop={marginTop}
        padding="$3"
        justifyContent="center"
        alignItems="center"
        backgroundColor="$backgroundSecondary"
      >
        <View flexDirection="row" alignItems="center" gap="$2">
          <SafeFontIcon name="eye-n" size={20} color="$colorLight" />
          <Text color="$colorLight" fontSize="$5" fontWeight={600}>
            This is a read-only account
          </Text>
        </View>
      </Container>
    )
  }

  return null
}
