import { createClient } from './supabase.service'
import { BadgesHelper, type IBadgesHelper } from './badges.helper'

export type Badge = {
  points: number
  name: string
  id: string
}

class BadgesServices {
  private supabase = createClient()
  private badges: Badge[] = []
  private helper: IBadgesHelper

  constructor() {
    this.helper = new BadgesHelper(this.supabase)
  }

  public async getBadges(eoas: string[], account: string): Promise<Badge[]> {
    const { data: _account, error: accountError } = await this.supabase
      .from('Account')
      .select('*')
      .eq('address', account)
      .single()

    if (!account && !accountError) {
      await this.supabase.from('Account').insert([{ account }])
    }
    const activeBadges = await this.getActiveBadges()

    for (const badge of activeBadges) {
      const { data: accountBadge, error } = await this.supabase
        .from('AccountBadges')
        .select('*')
        .eq('badgeId', badge.id)
        .eq('account', account)
        .eq('isDeleted', false)
        .single()

      if (error) {
        console.error(`Error fetching badge for account ${account}:`, error)
        continue
      }

      let params = {}
      if (accountBadge) {
        params =
          badge.dataOrigin === 'onChain'
            ? {
                blockNumber: accountBadge.lastClaimBlock,
                points: accountBadge.points,
              }
            : {
                timestamp: accountBadge.lastClaim,
                points: accountBadge.points,
              }
      }

      await this.updateBadgeDataForAccount(account, eoas, badge, params)
    }

    return this.badges
  }

  private async updateBadgeDataForAccount(account: string, eoas: string[], badge: Badge, params: any) {
    console.log(`Actualizando datos para la badge ${badge.name} del usuario ${account} con parámetros:`, params)
    switch (badge.name) {
      case 'Optimism Transactions':
        const optimismTransactions = await this.helper.getOptimisimTransactions(eoas, params.blockNumber)
        let optimismPoints = 0
        if (optimismTransactions > 250) {
          optimismPoints = 50
        } else if (optimismTransactions > 100) {
          optimismPoints = 40
        } else if (optimismTransactions > 50) {
          optimismPoints = 30
        } else if (optimismTransactions > 20) {
          optimismPoints = 20
        } else if (optimismTransactions > 10) {
          optimismPoints = 10
        }
        optimismPoints -= params.points
        this.badges.push({
          name: badge.name,
          points: optimismPoints,
          id: badge.id,
        })
        break
      case 'Base Transactions':
        const baseTransactions = await this.helper.getBaseTransactions(eoas, params.blockNumber)

        let basePoints = 0
        if (baseTransactions > 250) {
          basePoints = 50
        } else if (baseTransactions > 100) {
          basePoints = 40
        } else if (baseTransactions > 50) {
          basePoints = 30
        } else if (baseTransactions > 20) {
          basePoints = 20
        } else if (baseTransactions > 10) {
          basePoints = 10
        }
        basePoints -= params.points
        this.badges.push({
          name: badge.name,
          points: basePoints,
          id: badge.id,
        })
        break

      case 'Mode transactions':
        const modeTransactions = await this.helper.getModeTransactions(eoas, params.blockNumber)

        let modePoints = 0
        if (modeTransactions > 250) {
          modePoints = 50
        } else if (modeTransactions > 100) {
          modePoints = 40
        } else if (modeTransactions > 50) {
          modePoints = 30
        } else if (modeTransactions > 20) {
          modePoints = 20
        } else if (modeTransactions > 10) {
          modePoints = 10
        }
        modePoints -= params.points
        this.badges.push({
          name: badge.name,
          points: modePoints,
          id: badge.id,
        })
        break

      case 'Citizen':
        let isCitizen = await this.helper.isCitizen(eoas)
        isCitizen = isCitizen && !params.points
        this.badges.push({
          name: badge.name,
          points: isCitizen ? 100 : 0,
          id: badge.id,
        })
        break

      case 'Nouns':
        const countNouns = await this.helper.hasNouns(eoas)
        let nounsPoints = 0
        if (countNouns > 5) {
          nounsPoints = 30
        } else if (countNouns > 3) {
          nounsPoints = 20
        } else if (countNouns > 1) {
          nounsPoints = 10
        }
        this.badges.push({
          name: badge.name,
          points: nounsPoints,
          id: badge.id,
        })
        break
    }
  }

  private async getActiveBadges() {
    const { data: badges, error } = await this.supabase.from('Badges').select('*').eq('isActive', true)

    if (error) {
      console.error('Error fetching active badges:', error)
      return []
    }

    return badges
  }
}

export const badgesService = new BadgesServices()
