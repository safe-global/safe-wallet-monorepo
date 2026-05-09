import { Text } from 'tamagui'
import { Container } from '@/src/components/Container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export const AddressesEmptyState = () => (
  <Container marginHorizontal="$3" marginTop="$6" alignItems="center">
    <SafeFontIcon name="alert" size={48} color="$colorSecondary" />
    <Text fontSize="$4" color="$colorSecondary" textAlign="center" marginTop="$3">
      No addresses found.{'\n'}
      Please check your device connection.
    </Text>
  </Container>
)
