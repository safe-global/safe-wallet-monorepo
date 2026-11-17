import { faker } from '@faker-js/faker'
import { resolveCosignerServiceUrl } from '../constants'
import { SAFE_POLICY_GUARD_BY_DELAY, isKnownPolicyGuard } from '../../policy-guard/constants'

describe('isKnownPolicyGuard', () => {
  it.each(Object.entries(SAFE_POLICY_GUARD_BY_DELAY))('recognises the %s guard', (_, guard) => {
    expect(isKnownPolicyGuard(guard)).toBe(true)
  })

  it('recognises the 180s guard regardless of address casing', () => {
    expect(isKnownPolicyGuard('0x4D1FB05CC9BCD31CCA651B2833B4E71229C31D1F')).toBe(true)
  })

  it('does not recognise another guard', () => {
    expect(isKnownPolicyGuard(faker.finance.ethereumAddress())).toBe(false)
  })

  it('does not recognise a Safe without a guard', () => {
    expect(isKnownPolicyGuard(undefined)).toBe(false)
  })
})

describe('resolveCosignerServiceUrl', () => {
  const envUrl = faker.internet.url({ appendSlash: false })

  it('uses the URL saved for the chain over the env', () => {
    const savedUrl = faker.internet.url({ appendSlash: false })

    expect(resolveCosignerServiceUrl('11155111', { '11155111': `${savedUrl}/` }, envUrl, ['11155111'])).toBe(savedUrl)
  })

  it('falls back to the env URL on a chain the env lists', () => {
    expect(resolveCosignerServiceUrl('11155111', {}, envUrl, ['1', '11155111'])).toBe(envUrl)
  })

  it('is off on a chain with no saved URL that the env does not list', () => {
    expect(resolveCosignerServiceUrl('137', {}, envUrl, ['1', '11155111'])).toBeUndefined()
  })

  it('enables a chain from a saved URL alone, without any env configuration', () => {
    const savedUrl = faker.internet.url({ appendSlash: false })

    expect(resolveCosignerServiceUrl('137', { '137': savedUrl }, '', [])).toBe(savedUrl)
  })

  it('is off when the env lists the chain but sets no URL', () => {
    expect(resolveCosignerServiceUrl('11155111', {}, '', ['11155111'])).toBeUndefined()
  })
})
