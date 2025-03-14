import { getAvailableChainsNames } from './chains'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

describe('getAvailableChainsNames', () => {
  it('returns an empty string when the chains array is empty', () => {
    expect(getAvailableChainsNames([])).toBe('')
  })

  it('returns the single chain name when only one chain is provided', () => {
    const chains = [{ chainName: 'Ethereum' }] as Chain[]
    expect(getAvailableChainsNames(chains)).toBe('Ethereum')
  })

  it('returns a properly formatted string for two chains', () => {
    const chains = [{ chainName: 'Ethereum' }, { chainName: 'Polygon' }] as Chain[]
    expect(getAvailableChainsNames(chains)).toBe('Ethereum and Polygon')
  })

  it('returns a properly formatted string for multiple chains', () => {
    const chains = [
      { chainName: 'Ethereum' },
      { chainName: 'Polygon' },
      { chainName: 'Binance Smart Chain' },
    ] as Chain[]
    expect(getAvailableChainsNames(chains)).toBe('Ethereum, Polygon and Binance Smart Chain')
  })
})
