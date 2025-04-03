import { useAppSelector } from '@/store'
import { lastUsedSpace } from '@/store/authSlice'

export const useCurrentSpaceId = () => {
  return useAppSelector(lastUsedSpace)
}
