import { SignError } from '@/src/features/ConfirmTx/components/SignTransaction/SignError'
import { useLocalSearchParams } from 'expo-router'

export default function SigningErrorScreen() {
  const { description } = useLocalSearchParams<{ description: string }>()
  return <SignError description={description} />
}
