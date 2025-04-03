import { Container } from '@/src/components/Container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { View, Text } from 'tamagui'

export const ReadOnly = ({ signers }: { signers: string[] }) => {
  if (signers.length === 0) {
    return (
      <Container padding="$2" justifyContent="center" alignItems="center" backgroundColor="$backgroundSecondary">
        <View flexDirection="row" alignItems="center" gap="$2">
          <SafeFontIcon name="eye-n" size={20} color="$colorLight" />
          <Text color="$colorLight" fontWeight={600}>
            This is a read-only account
          </Text>
        </View>
      </Container>
    )
  }

  return null
}
