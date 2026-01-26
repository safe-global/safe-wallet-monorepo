import { getReadablePositionType } from '../utils/getReadablePositionType'

describe('getReadablePositionType', () => {
  it('returns "Deposited" for deposit type', () => {
    expect(getReadablePositionType('deposit')).toBe('Deposited')
  })

  it('returns "Debt" for loan type', () => {
    expect(getReadablePositionType('loan')).toBe('Debt')
  })

  it('returns "Locked" for locked type', () => {
    expect(getReadablePositionType('locked')).toBe('Locked')
  })

  it('returns "Staking" for staked type', () => {
    expect(getReadablePositionType('staked')).toBe('Staking')
  })

  it('returns "Reward" for reward type', () => {
    expect(getReadablePositionType('reward')).toBe('Reward')
  })

  it('returns "Wallet" for wallet type', () => {
    expect(getReadablePositionType('wallet')).toBe('Wallet')
  })

  it('returns "Airdrop" for airdrop type', () => {
    expect(getReadablePositionType('airdrop')).toBe('Airdrop')
  })

  it('returns "Margin" for margin type', () => {
    expect(getReadablePositionType('margin')).toBe('Margin')
  })

  it('returns "Unknown" for unknown type', () => {
    expect(getReadablePositionType('unknown')).toBe('Unknown')
  })

  it('returns "Unknown" for null', () => {
    expect(getReadablePositionType(null)).toBe('Unknown')
  })

  it('returns "Unknown" for undefined', () => {
    expect(getReadablePositionType(undefined)).toBe('Unknown')
  })

  it('returns "Unknown" for empty string', () => {
    expect(getReadablePositionType('')).toBe('Unknown')
  })

  it('returns "Unknown" for unrecognized string', () => {
    expect(getReadablePositionType('invalid-type')).toBe('Unknown')
  })
})
