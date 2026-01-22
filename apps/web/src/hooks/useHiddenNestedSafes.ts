import { useAppSelector } from '@/store'
import { selectHiddenNestedSafes } from '@/store/settingsSlice'
import useSafeAddress from './useSafeAddress'

const useHiddenNestedSafes = (): string[] => {
  const safeAddress = useSafeAddress()
  return useAppSelector((state) => selectHiddenNestedSafes(state, safeAddress))
}

export default useHiddenNestedSafes
