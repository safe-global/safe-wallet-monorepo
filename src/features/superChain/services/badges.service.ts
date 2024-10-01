import { zeroAddress, type Address } from 'viem'
import axios from 'axios'
import { BACKEND_BASE_URI } from '@/config/constants'
import type { ResponseBadge } from '@/types/super-chain'
import local from '@/services/local-storage/local'
import type { Setter } from '@/services/local-storage/useLocalStorage'

type Perks = {
  name: string
  value: number
}[]
class BadgesService {
  httpInstance = axios.create({
    baseURL: BACKEND_BASE_URI,
  })
  public switchFavoriteBadge(
    badgeId: number,
    safe: Address,
    isFavorite: boolean,
    setLocalStorage: Setter<string>,
  ): void {
    if (!local) return
    const favoriteBadges = local.getItem<string>('favoriteBadges')
    if (!favoriteBadges) {
      setLocalStorage(JSON.stringify([badgeId.toString().concat(safe)]))
    } else {
      const parsedFavoriteBadges = JSON.parse(favoriteBadges)
      if (isFavorite) {
        parsedFavoriteBadges.push(badgeId.toString().concat(safe))
      } else {
        const index = parsedFavoriteBadges.findIndex((id: string) => id === badgeId.toString().concat(safe))
        parsedFavoriteBadges.splice(index, 1)
      }
      setLocalStorage(JSON.stringify(parsedFavoriteBadges))
    }
  }
  public getFavoriteBadges(safe: Address): string[] {
    if (!local) return []
    const favoriteBadges = local.getItem<string>('favoriteBadges')
    if (!favoriteBadges) return []

    return JSON.parse(favoriteBadges)
      .filter((id: string) => id.endsWith(safe))
      .map((id: string) => id.replace(safe, ''))
  }
  public async getBadges(account?: Address): Promise<{
    currentBadges: ResponseBadge[]
  }> {
    const response = await this.httpInstance.get<{
      currentBadges: ResponseBadge[]
    }>('/get-badges', {
      headers: {
        account: account || zeroAddress,
      },
    })
    return response.data
  }
  public async attestBadges(account?: Address) {
    const response = await this.httpInstance.post(
      '/attest-badges',
      {},
      { headers: { account: account || zeroAddress } },
    )
    return response.data
  }
  public async getPerks(account: Address) {
    const response = await this.httpInstance.get<{ perks: Perks }>('/get-perks', {
      headers: {
        account: account || zeroAddress,
      },
    })
    return response.data.perks
  }
}
const badgesService = new BadgesService()
export default badgesService
