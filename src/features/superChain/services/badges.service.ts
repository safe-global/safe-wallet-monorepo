import type { Address } from 'viem'
import axios from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import type { AccountBadge } from '@/types/super-chain'
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
}
const badgesService = new BadgesService()
export default badgesService
