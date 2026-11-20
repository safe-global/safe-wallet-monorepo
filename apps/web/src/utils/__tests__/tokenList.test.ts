import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { isTrustedTokenList } from '../tokenList'

const chainWith = (features: FEATURES[]) => chainBuilder().with({ features }).build()

const PORTFOLIO_AND_TOKENLIST = [FEATURES.PORTFOLIO_ENDPOINT, FEATURES.DEFAULT_TOKENLIST]

describe('isTrustedTokenList', () => {
  it.each([TOKEN_LISTS.TRUSTED, undefined])(
    'is true for the %s token list on a chain with the portfolio and default token list',
    (tokenList) => {
      expect(isTrustedTokenList(chainWith(PORTFOLIO_AND_TOKENLIST), tokenList)).toBe(true)
    },
  )

  it('is false when the user shows all tokens', () => {
    expect(isTrustedTokenList(chainWith(PORTFOLIO_AND_TOKENLIST), TOKEN_LISTS.ALL)).toBe(false)
  })

  it('is false on a chain without the default token list', () => {
    expect(isTrustedTokenList(chainWith([FEATURES.PORTFOLIO_ENDPOINT]), TOKEN_LISTS.TRUSTED)).toBe(false)
  })

  it('is false on a chain without the portfolio endpoint', () => {
    expect(isTrustedTokenList(chainWith([FEATURES.DEFAULT_TOKENLIST]), TOKEN_LISTS.TRUSTED)).toBe(false)
  })
})
