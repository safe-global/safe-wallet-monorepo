import type { Position } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

type PositionType = Position['position_type']

export const getReadablePositionType = (positionType: PositionType | string | null | undefined): string => {
  if (positionType === null || positionType === undefined || positionType === '') {
    return 'Unknown'
  }

  switch (positionType) {
    case 'deposit':
      return 'Deposited'
    case 'loan':
      return 'Debt'
    case 'locked':
      return 'Locked'
    case 'staked':
      return 'Staking'
    case 'reward':
      return 'Reward'
    case 'wallet':
      return 'Wallet'
    case 'airdrop':
      return 'Airdrop'
    case 'margin':
      return 'Margin'
    case 'unknown':
      return 'Unknown'
    default:
      return 'Unknown'
  }
}
