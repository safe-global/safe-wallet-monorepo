import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export const useSpaceSafeCount = (spaceId: number): number => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData } = useSpaceSafesGetV1Query({ spaceId }, { skip: !isUserSignedIn })
  const safes = currentData?.safes || {}

  return Object.values(safes).reduce((acc, safesOnChain) => acc + safesOnChain.length, 0)
}
