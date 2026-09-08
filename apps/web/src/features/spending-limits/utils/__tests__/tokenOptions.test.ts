import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { balanceBuilder, erc20TokenBuilder, nativeTokenBuilder } from '@/tests/builders/balances'
import type { PopularToken } from '../../popularTokens'
import { buildTokenOptions, findTokenOption, tokenOptionLabel, type NativeCurrencyInfo } from '../tokenOptions'

const popularTokenBuilder = (overrides: Partial<PopularToken> = {}): PopularToken => ({
  symbol: faker.finance.currencyCode(),
  name: faker.finance.currencyName(),
  address: checksumAddress(faker.finance.ethereumAddress()),
  decimals: 18,
  logoUri: faker.image.url(),
  ...overrides,
})

const native: NativeCurrencyInfo = { symbol: 'ETH', name: 'Ether', decimals: 18, logoUri: faker.image.url() }

describe('buildTokenOptions', () => {
  it('keeps zero-balance held tokens as held options', () => {
    const zero = balanceBuilder().with({ balance: '0', fiatBalance: '0' }).build()

    const options = buildTokenOptions({ balances: [zero], popular: [] })

    expect(options).toHaveLength(1)
    expect(options[0]).toMatchObject({ address: zero.tokenInfo.address, group: 'held', balance: '0' })
  })

  it('drops ERC-721 balances', () => {
    const nft = balanceBuilder()
      .with({ tokenInfo: { ...erc20TokenBuilder().build(), type: 'ERC721' as const } })
      .build()

    expect(buildTokenOptions({ balances: [nft], popular: [] })).toEqual([])
  })

  it('de-duplicates a popular token the Safe already holds, case-insensitively, keeping the held row', () => {
    const held = balanceBuilder().build()
    const popular = popularTokenBuilder({ address: held.tokenInfo.address.toLowerCase() })

    const options = buildTokenOptions({ balances: [held], popular: [popular] })

    expect(options).toHaveLength(1)
    expect(options[0].group).toBe('held')
    expect(options[0].balance).toBe(held.balance)
  })

  it('puts the synthesised native currency in the popular group when the Safe does not hold it', () => {
    const options = buildTokenOptions({ balances: [], popular: [], native })

    expect(options).toEqual([
      expect.objectContaining({ address: ZERO_ADDRESS, symbol: 'ETH', group: 'popular', decimals: 18 }),
    ])
  })

  it('does not duplicate the native currency when the balances already contain it', () => {
    const nativeBalance = balanceBuilder()
      .with({ tokenInfo: nativeTokenBuilder().with({ address: ZERO_ADDRESS }).build() })
      .build()

    const options = buildTokenOptions({ balances: [nativeBalance], popular: [], native })

    expect(options.filter((option) => option.address === ZERO_ADDRESS)).toHaveLength(1)
    expect(options[0].group).toBe('held')
  })

  it('omits the native currency entirely when none is given', () => {
    const options = buildTokenOptions({ balances: [], popular: [popularTokenBuilder()] })

    expect(options.some((option) => option.address === ZERO_ADDRESS)).toBe(false)
  })

  it('treats undefined balances (not loaded) as no held tokens', () => {
    const popular = popularTokenBuilder()

    const options = buildTokenOptions({ popular: [popular] })

    expect(options).toEqual([expect.objectContaining({ address: popular.address, group: 'popular' })])
  })

  it('sorts held by fiat balance descending, then popular alphabetically by symbol', () => {
    const rich = balanceBuilder().with({ fiatBalance: '300' }).build()
    const poor = balanceBuilder().with({ fiatBalance: '5' }).build()
    const zero = balanceBuilder().with({ fiatBalance: '0', balance: '0' }).build()
    const zed = popularTokenBuilder({ symbol: 'ZED' })
    const alpha = popularTokenBuilder({ symbol: 'ALPHA' })

    const options = buildTokenOptions({ balances: [zero, poor, rich], popular: [zed, alpha] })

    expect(options.map((option) => option.address)).toEqual([
      rich.tokenInfo.address,
      poor.tokenInfo.address,
      zero.tokenInfo.address,
      alpha.address,
      zed.address,
    ])
  })

  it('copies metadata from the popular table', () => {
    const popular = popularTokenBuilder({ decimals: 6 })

    const [option] = buildTokenOptions({ popular: [popular] })

    expect(option).toEqual({
      address: popular.address,
      symbol: popular.symbol,
      name: popular.name,
      decimals: 6,
      logoUri: popular.logoUri,
      group: 'popular',
    })
  })
})

describe('findTokenOption', () => {
  it('matches by address case-insensitively', () => {
    const [option] = buildTokenOptions({ popular: [popularTokenBuilder()] })

    expect(findTokenOption([option], option.address.toLowerCase())).toBe(option)
  })

  it('returns undefined for undefined or unknown addresses', () => {
    const [option] = buildTokenOptions({ popular: [popularTokenBuilder()] })

    expect(findTokenOption([option], undefined)).toBeUndefined()
    expect(findTokenOption([option], checksumAddress(faker.finance.ethereumAddress()))).toBeUndefined()
  })
})

describe('tokenOptionLabel', () => {
  it('prefers symbol, then name, then the shortened address', () => {
    const [option] = buildTokenOptions({ popular: [popularTokenBuilder({ symbol: 'ABC', name: 'Alphabet' })] })

    expect(tokenOptionLabel(option)).toBe('ABC')
    expect(tokenOptionLabel({ ...option, symbol: '' })).toBe('Alphabet')
    expect(tokenOptionLabel({ ...option, symbol: '', name: '' })).toBe(shortenAddress(option.address))
  })
})
