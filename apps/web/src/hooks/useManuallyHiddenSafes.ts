import { useAppSelector } from '@/store'
import { selectManuallyHiddenSafes } from '@/store/settingsSlice'
import useSafeAddress from './useSafeAddress'

const useManuallyHiddenSafes = (): string[] => {
  const safeAddress = useSafeAddress()
  return useAppSelector((state) => selectManuallyHiddenSafes(state, safeAddress))
}

export default useManuallyHiddenSafes
