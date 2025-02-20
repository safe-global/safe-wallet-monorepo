import { useRouter } from 'next/router'

export const useCurrentOrgId = () => {
  const router = useRouter()
  const orgId = Array.isArray(router.query.orgId) ? router.query.orgId[0] : router.query.orgId
  return orgId
}
