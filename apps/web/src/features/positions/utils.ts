import type { Position } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

export const getReadablePositionType = (positionType: Position['position_type']) => {
  if (positionType === null) return 'Unknown'

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
