import { useAppSelector } from '@/store'
import { selectUserUnhiddenNestedSafes } from '@/store/settingsSlice'
import useSafeAddress from './useSafeAddress'

const useUserUnhiddenNestedSafes = (): string[] => {
  const safeAddress = useSafeAddress()
  return useAppSelector((state) => selectUserUnhiddenNestedSafes(state, safeAddress))
}

export default useUserUnhiddenNestedSafes
