import type { Proposal } from '../types'
import { getFiat, getSummaryHint } from './columns'

const tx = (amount: string, extra: Partial<Proposal> = {}): Proposal => ({
  id: 'treasury-90',
  account: 'treasury',
  nonce: 90,
  recipient: 'Investor unlock · 0x4a1b…9c2d',
  amount,
  kind: { type: 'transfer' },
  age: '1d ago',
  signers: [],
  eligible: true,
  ...extra,
})

describe('Dollar values', () => {
  it('works out the value from the amount', () => {
    expect(getSummaryHint(tx('2,000,000 SAFE'))).toBe('$900,000')
  })

  it('keeps a value the fixture already has', () => {
    expect(getFiat(tx('48.5 ETH', { fiat: '$155,200' }))).toBe('$155,200')
  })

  it('values a swap by what it sells', () => {
    const swap = tx('', { kind: { type: 'swap', sell: '300 ETH', buy: '958,000 USDC', order: 'limit', expiry: '6d' } })
    expect(getSummaryHint(swap)).toBe('Limit order · $960,000 · 6d')
  })

  it('has no value for a token without a price', () => {
    expect(getSummaryHint(tx('12 XYZ'))).toBeUndefined()
  })
})
