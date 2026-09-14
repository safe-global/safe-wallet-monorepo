import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { findMatchingSafeApp, getSafeAppHostname } from '../safeAppMatch'

const makeApp = (url: string, name = 'App', id = 1): SafeAppData => ({
  id,
  url,
  name,
  description: '',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: [],
  features: [],
  socialProfiles: [],
  featured: false,
})

describe('getSafeAppHostname', () => {
  it('lowercases the hostname and strips a www. prefix', () => {
    expect(getSafeAppHostname('https://WWW.Uniswap.ORG/swap')).toBe('uniswap.org')
  })

  it('ignores scheme, port, path, query and hash', () => {
    expect(getSafeAppHostname('http://app.uniswap.org:3000/swap?chain=1#top')).toBe('app.uniswap.org')
  })

  it('returns undefined for malformed input rather than throwing', () => {
    expect(getSafeAppHostname('not a url')).toBeUndefined()
    expect(getSafeAppHostname('')).toBeUndefined()
  })
})

describe('findMatchingSafeApp', () => {
  it('matches an app on the same hostname', () => {
    const apps = [makeApp('https://app.uniswap.org', 'Uniswap'), makeApp('https://app.aave.com', 'Aave', 2)]

    expect(findMatchingSafeApp(apps, 'https://app.uniswap.org/swap')?.name).toBe('Uniswap')
  })

  it('matches across www., scheme, trailing slash and query differences', () => {
    const apps = [makeApp('https://app.uniswap.org/', 'Uniswap')]

    expect(findMatchingSafeApp(apps, 'http://www.app.uniswap.org?ref=x')?.name).toBe('Uniswap')
  })

  it('returns undefined when nothing matches', () => {
    const apps = [makeApp('https://app.aave.com', 'Aave')]

    expect(findMatchingSafeApp(apps, 'https://app.uniswap.org')).toBeUndefined()
  })

  it('returns undefined for a malformed dApp URL', () => {
    const apps = [makeApp('https://app.uniswap.org', 'Uniswap')]

    expect(findMatchingSafeApp(apps, 'not a url')).toBeUndefined()
  })

  it('returns undefined for empty inputs', () => {
    expect(findMatchingSafeApp([], 'https://app.uniswap.org')).toBeUndefined()
    expect(findMatchingSafeApp(undefined, 'https://app.uniswap.org')).toBeUndefined()
    expect(findMatchingSafeApp([makeApp('https://app.uniswap.org')], '')).toBeUndefined()
  })

  it('disambiguates apps sharing a hostname by exact path', () => {
    const apps = [
      makeApp('https://apps-portal.safe.global/tx-builder', 'Transaction Builder', 1),
      makeApp('https://apps-portal.safe.global/drain-safe', 'Drain Account', 2),
    ]

    expect(findMatchingSafeApp(apps, 'https://apps-portal.safe.global/drain-safe')?.name).toBe('Drain Account')
  })

  // The disambiguation branch compares origin+path, so a trailing slash on either side must
  // not stop a genuine match
  it('disambiguates by path across a trailing slash difference', () => {
    const apps = [
      makeApp('https://apps-portal.safe.global/tx-builder', 'Transaction Builder', 1),
      makeApp('https://apps-portal.safe.global/drain-safe', 'Drain Account', 2),
    ]

    expect(findMatchingSafeApp(apps, 'https://apps-portal.safe.global/tx-builder/')?.name).toBe('Transaction Builder')
  })

  it('recommends nothing when several apps share a hostname and no path matches', () => {
    const apps = [
      makeApp('https://apps-portal.safe.global/tx-builder', 'Transaction Builder', 1),
      makeApp('https://apps-portal.safe.global/drain-safe', 'Drain Account', 2),
    ]

    expect(findMatchingSafeApp(apps, 'https://apps-portal.safe.global/something-else')).toBeUndefined()
  })
})
