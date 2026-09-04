import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { chainBuilder } from '@/tests/builders/chains'
import { getNativeRouteForSafeApp } from './nativeRoutes'

const chainWith = (...features: FEATURES[]) => chainBuilder().with({ features }).build()

describe('getNativeRouteForSafeApp', () => {
  const allFeatures = [FEATURES.SAFE_APPS_NATIVE_REDIRECT, FEATURES.NATIVE_SWAPS, FEATURES.BRIDGE]

  it('routes CoW Swap to the native swap page', () => {
    expect(getNativeRouteForSafeApp('https://swap.cow.fi', chainWith(...allFeatures))).toBe(AppRoutes.swap)
  })

  it('routes Jumper to the native bridge page for both domains and a www prefix', () => {
    const chain = chainWith(...allFeatures)

    expect(getNativeRouteForSafeApp('https://jumper.xyz', chain)).toBe(AppRoutes.bridge)
    expect(getNativeRouteForSafeApp('https://jumper.exchange/?foo=bar', chain)).toBe(AppRoutes.bridge)
    expect(getNativeRouteForSafeApp('https://www.jumper.exchange/', chain)).toBe(AppRoutes.bridge)
  })

  it('does not redirect when the redirect flag is disabled', () => {
    const chain = chainWith(FEATURES.NATIVE_SWAPS, FEATURES.BRIDGE)

    expect(getNativeRouteForSafeApp('https://swap.cow.fi', chain)).toBeUndefined()
    expect(getNativeRouteForSafeApp('https://jumper.xyz', chain)).toBeUndefined()
  })

  it('does not redirect when the native destination is unavailable on the chain', () => {
    const chain = chainWith(FEATURES.SAFE_APPS_NATIVE_REDIRECT)

    expect(getNativeRouteForSafeApp('https://swap.cow.fi', chain)).toBeUndefined()
    expect(getNativeRouteForSafeApp('https://jumper.xyz', chain)).toBeUndefined()
  })

  it('ignores unrelated apps, subdomains and lookalike hosts', () => {
    const chain = chainWith(...allFeatures)

    expect(getNativeRouteForSafeApp('https://app.uniswap.org', chain)).toBeUndefined()
    expect(getNativeRouteForSafeApp('https://docs.cow.fi', chain)).toBeUndefined()
    expect(getNativeRouteForSafeApp('https://swap.cow.fi.evil.com', chain)).toBeUndefined()
  })

  it('returns undefined for missing or invalid inputs', () => {
    const chain = chainWith(...allFeatures)

    expect(getNativeRouteForSafeApp(undefined, chain)).toBeUndefined()
    expect(getNativeRouteForSafeApp('https://swap.cow.fi', undefined)).toBeUndefined()
    expect(getNativeRouteForSafeApp('not a url', chain)).toBeUndefined()
  })
})
