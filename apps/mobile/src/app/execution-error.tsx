import { ExecuteError } from '@/src/features/ExecuteTx/components/ExecuteError'
import { useLocalSearchParams } from 'expo-router'

export default function ExecutionErrorScreen() {
  const { description } = useLocalSearchParams<{ description: string }>()
  return <ExecuteError description={description} />
}
