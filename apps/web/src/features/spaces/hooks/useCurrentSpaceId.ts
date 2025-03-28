import { useRouter } from 'next/router'

export const useCurrentSpaceId = () => {
  const router = useRouter()
  const spaceId = Array.isArray(router.query.spaceId) ? router.query.spaceId[0] : router.query.spaceId
  return spaceId
}
