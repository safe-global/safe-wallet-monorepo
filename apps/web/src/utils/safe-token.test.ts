import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { SAFE_TOKEN_ADDRESSES } from '@/config/constants'
import { isSafeToken } from './safe-token'

const MAINNET = '1'
const CHAIN_WITHOUT_SAFE_TOKEN = '137'

describe('isSafeToken', () => {
  it('matches the SAFE token on a supported chain', () => {
    expect(isSafeToken(MAINNET, SAFE_TOKEN_ADDRESSES[MAINNET])).toBe(true)
  })

  it('ignores address casing', () => {
    expect(isSafeToken(MAINNET, SAFE_TOKEN_ADDRESSES[MAINNET].toLowerCase())).toBe(true)
    expect(isSafeToken(MAINNET, SAFE_TOKEN_ADDRESSES[MAINNET].toUpperCase())).toBe(true)
  })

  it('rejects any other token on a supported chain', () => {
    expect(isSafeToken(MAINNET, checksumAddress(faker.finance.ethereumAddress()))).toBe(false)
  })

  it('rejects every token on a chain with no SAFE token', () => {
    expect(isSafeToken(CHAIN_WITHOUT_SAFE_TOKEN, SAFE_TOKEN_ADDRESSES[MAINNET])).toBe(false)
  })
})
