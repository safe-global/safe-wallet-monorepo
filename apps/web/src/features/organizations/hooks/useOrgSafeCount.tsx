import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useOrganizationSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'

export const useOrgSafeCount = (orgId: number): number => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData } = useOrganizationSafesGetV1Query({ organizationId: orgId }, { skip: !isUserSignedIn })
  const safes = currentData?.safes || {}

  return Object.values(safes).reduce((acc, safesOnChain) => acc + safesOnChain.length, 0)
}
