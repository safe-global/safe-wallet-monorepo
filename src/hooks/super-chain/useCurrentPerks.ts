import badgesService from '@/features/superChain/services/badges.service'
import useSafeInfo from '../useSafeInfo'
import { useQuery } from '@tanstack/react-query'

function useCurrentPerks() {
  const { safeAddress } = useSafeInfo()
  const getPerks = async () => {
    const perks = await badgesService.getPerks(safeAddress as `0x${string}`)
    return perks
  }

  return useQuery({
    queryKey: ['currentPerks', safeAddress],
    queryFn: getPerks,
    enabled: !!safeAddress,
  })
}
export default useCurrentPerks
