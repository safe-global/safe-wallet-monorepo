import { DEPRECATED_TOKEN_ADDRESSES, isDeprecatedToken } from '@/config/deprecatedTokens'

describe('deprecatedTokens', () => {
  it('lists the Monerium EURe v1 contracts', () => {
    expect(DEPRECATED_TOKEN_ADDRESSES).toContain('0x3231Cb76718CDeF2155FC47b5286d82e6eDA273f') // Ethereum
    expect(DEPRECATED_TOKEN_ADDRESSES).toContain('0xcB444e90D8198415266c6a2724b7900fb12FC56E') // Gnosis
    expect(DEPRECATED_TOKEN_ADDRESSES).toContain('0x18ec0A6E18E5bc3784fDd3a3634b31245ab704F6') // Polygon
  })

  it('matches deprecated tokens regardless of casing', () => {
    expect(isDeprecatedToken('0xcb444e90d8198415266c6a2724b7900fb12fc56e')).toBe(true)
    expect(isDeprecatedToken('0xCB444E90D8198415266C6A2724B7900FB12FC56E')).toBe(true)
  })

  it('does not match unknown tokens', () => {
    expect(isDeprecatedToken('0x0000000000000000000000000000000000000000')).toBe(false)
    // Monerium EURe v2 (Gnosis) must remain visible
    expect(isDeprecatedToken('0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430')).toBe(false)
  })
})
