import { zeroAddress, type Address } from 'viem'
import axios from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import type { AccountBadge, ResponseBadges } from '@/types/super-chain'
class BadgesService {
  httpInstance = axios.create({
    baseURL: BACKEND_BASE_URI,
  })
  public async switchFavoriteBadge(badgeId: number, account: Address, isFavorite: boolean): Promise<void> {
    const params: Partial<AccountBadge> & { account: Address } = {
      badgeid: badgeId,
      account,
      favorite: isFavorite,
    }
    this.httpInstance.put(
      '/badge',
      {},
      {
        params,
      },
    )
  }
  public async getBadges(account?: Address): Promise<{
    currentBadges: ResponseBadges[]
    totalPoints: number
  }> {
    const response = await this.httpInstance.get<{
      currentBadges: ResponseBadges[]
      totalPoints: number
    }>('/get-badges', {
      headers: {
        account: account || zeroAddress,
      },
    })
    return response.data
  }
}
const badgesService = new BadgesService()
export default badgesService
