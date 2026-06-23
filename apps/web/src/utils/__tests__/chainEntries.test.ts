import { pickSupportedChainEntries } from '../chainEntries'

describe('pickSupportedChainEntries', () => {
  const chains = [{ chainId: '1' }, { chainId: '100' }]

  it('keeps only entries whose chainId appears in the supported chains list', () => {
    const entries = {
      '1': { foo: 'mainnet' },
      '100': { foo: 'gnosis' },
      '137': { foo: 'polygon' },
    }
    expect(pickSupportedChainEntries(entries, chains)).toEqual({
      '1': { foo: 'mainnet' },
      '100': { foo: 'gnosis' },
    })
  })

  it('returns an empty object when the input map is undefined', () => {
    expect(pickSupportedChainEntries(undefined, chains)).toEqual({})
  })

  it('drops everything when the supported chains list is empty', () => {
    expect(pickSupportedChainEntries({ '1': 'x' }, [])).toEqual({})
  })

  it('does not mutate the input map', () => {
    const entries = { '1': 'mainnet', '137': 'polygon' }
    pickSupportedChainEntries(entries, chains)
    expect(entries).toEqual({ '1': 'mainnet', '137': 'polygon' })
  })
})
