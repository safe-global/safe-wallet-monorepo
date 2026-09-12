import { ExecuteError } from '@/src/features/ExecuteTx/components/ExecuteError'
import { useLocalSearchParams } from 'expo-router'

export default function ExecutionErrorScreen() {
  const { description, code } = useLocalSearchParams<{ description: string; code?: string }>()
  return <ExecuteError description={description} reference={code} />
}
