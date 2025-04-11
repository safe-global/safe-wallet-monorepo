import { useLocalSearchParams } from 'expo-router'
import { Text } from 'tamagui'

export const SignerHeader = () => {
  const { title = 'Signer' } = useLocalSearchParams<{ title: string }>()
  return <Text>{title}</Text>
}
