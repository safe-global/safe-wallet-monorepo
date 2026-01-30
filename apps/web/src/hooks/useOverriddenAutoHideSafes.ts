import { useAppSelector } from '@/store'
import { selectOverriddenAutoHideSafes } from '@/store/settingsSlice'
import useSafeAddress from './useSafeAddress'

const useOverriddenAutoHideSafes = (): string[] => {
  const safeAddress = useSafeAddress()
  return useAppSelector((state) => selectOverriddenAutoHideSafes(state, safeAddress))
}

export default useOverriddenAutoHideSafes
