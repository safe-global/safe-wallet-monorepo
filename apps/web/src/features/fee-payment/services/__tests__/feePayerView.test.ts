import type { SponsoredOffer } from '@/utils/gasPayment'
import { buildFooter, buildPayerControl, resolveChoice } from '../feePayerView'

const SIGN = { step: 'sign' as const, hasSponsoredOffer: false, isSafeOptionShown: true }
const EXECUTE_SPONSORED = { step: 'execute' as const, hasSponsoredOffer: true, isSafeOptionShown: false }

describe('resolveChoice', () => {
  it('keeps a locked payload on the Safe whatever was picked', () => {
    expect(resolveChoice({ ...SIGN, isLocked: true, explicitChoice: 'WALLET' })).toBe('PAY_FROM_SAFE')
  })

  it('prefers the signer pick over the remembered one', () => {
    expect(
      resolveChoice({ ...SIGN, isLocked: false, explicitChoice: 'WALLET', preferredChoice: 'PAY_FROM_SAFE' }),
    ).toBe('WALLET')
  })

  it('ignores a pick that is not on offer', () => {
    expect(resolveChoice({ ...SIGN, isLocked: false, explicitChoice: 'SPONSORED' })).toBe('WALLET')
  })

  it('defaults to the sponsor at execution', () => {
    expect(resolveChoice({ ...EXECUTE_SPONSORED, isLocked: false, preferredChoice: 'PAY_FROM_SAFE' })).toBe('SPONSORED')
  })

  it('uses the remembered Safe account pick while the Safe option is shown', () => {
    expect(resolveChoice({ ...SIGN, isLocked: false, preferredChoice: 'PAY_FROM_SAFE' })).toBe('PAY_FROM_SAFE')
    expect(
      resolveChoice({ ...SIGN, isSafeOptionShown: false, isLocked: false, preferredChoice: 'PAY_FROM_SAFE' }),
    ).toBe('WALLET')
  })
})

describe('buildPayerControl', () => {
  const base = {
    isLocked: false,
    step: 'sign' as const,
    planState: 'FREE' as const,
    offersSafeToggle: true,
    isProposing: false,
    hasSponsoredOffer: false,
    choice: 'WALLET' as const,
  }

  it('locks a Safe-paid payload', () => {
    expect(buildPayerControl({ ...base, isLocked: true })).toEqual({ kind: 'locked', value: 'PAY_FROM_SAFE' })
  })

  it('locks the plan at signing while it has sponsored transactions left', () => {
    expect(buildPayerControl({ ...base, planState: 'PRO_SPONSORED_LEFT' })).toEqual({
      kind: 'locked',
      value: 'SPONSORED',
    })
  })

  it('offers Safe account or Signer wallet at signing', () => {
    expect(buildPayerControl({ ...base, choice: 'PAY_FROM_SAFE' })).toEqual({
      kind: 'choice',
      value: 'PAY_FROM_SAFE',
      options: ['PAY_FROM_SAFE', 'WALLET'],
    })
  })

  it('tells a proposer that the first signer picks', () => {
    expect(buildPayerControl({ ...base, offersSafeToggle: false, isProposing: true })).toEqual({
      kind: 'locked',
      value: 'WALLET',
      reason: 'Whoever signs first picks who pays the gas fee.',
    })
  })

  it('offers the sponsor or Signer wallet at execution', () => {
    expect(buildPayerControl({ ...base, step: 'execute', hasSponsoredOffer: true, choice: 'SPONSORED' })).toEqual({
      kind: 'choice',
      value: 'SPONSORED',
      options: ['SPONSORED', 'WALLET'],
    })
  })

  it('locks Signer wallet at execution when nothing else is on offer', () => {
    expect(buildPayerControl({ ...base, step: 'execute', offersSafeToggle: false })).toEqual({
      kind: 'locked',
      value: 'WALLET',
    })
  })
})

describe('buildFooter', () => {
  const base = { offer: null, chainSponsorsPlans: true, planState: 'FREE' as const, left: null, meter: null }

  it('shows the plan counter of a subscription offer', () => {
    const offer: SponsoredOffer = {
      option: 'SUBSCRIPTION',
      disabledReason: null,
      spaceId: '1',
      left: 7,
      meter: null,
    }
    expect(buildFooter({ ...base, offer })).toEqual({
      kind: 'counter',
      left: 7,
      quota: null,
      resetsAt: null,
      isSubscription: true,
    })
  })

  it("shows the chain's free relays left", () => {
    const offer: SponsoredOffer = {
      option: 'FREE_DAILY_LIMIT',
      disabledReason: null,
      relays: { remaining: 3, limit: 5 },
      isPro: false,
    }
    expect(buildFooter({ ...base, offer })).toEqual({
      kind: 'counter',
      left: 3,
      quota: 5,
      resetsAt: null,
      isSubscription: false,
    })
  })

  it('shows nothing where the chain sponsors no plans', () => {
    expect(buildFooter({ ...base, chainSponsorsPlans: false })).toEqual({ kind: 'none' })
  })

  it('upsells a Safe without a plan', () => {
    expect(buildFooter(base)).toEqual({ kind: 'upsell' })
  })
})
