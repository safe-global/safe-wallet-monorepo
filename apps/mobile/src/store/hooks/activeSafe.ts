import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppSelector } from '@/src/store/hooks/index'

export const useDefinedActiveSafe = () => {
  const activeSafe = useAppSelector(selectActiveSafe)

  if (activeSafe === null) {
    throw new Error('No active safe selected')
  }
  return activeSafe
}
