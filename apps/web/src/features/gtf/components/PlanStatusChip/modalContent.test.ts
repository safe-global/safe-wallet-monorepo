import { AppRoutes } from '@/config/routes'
import { getModalContent } from './modalContent'
import { PLAN_STATUS_MOCKS } from './mocks'

const SPACE_ID = 'space-123'
const billing = `${AppRoutes.spaces.billing}?spaceId=${SPACE_ID}`

describe('getModalContent', () => {
  it('shows the workspace promo CTA when the Safe is not in a workspace', () => {
    const content = getModalContent(PLAN_STATUS_MOCKS.noWorkspace, SPACE_ID)
    expect(content.cta).toEqual({ label: 'Create a Workspace', href: AppRoutes.spaces.createSpace })
    expect(content.comparison).toBeUndefined()
    expect(content.showSafesSelector).toBe(false)
    expect(content.showPaygFootnote).toBe(false)
  })

  it('offers "Compare plans" for a Starter within limit', () => {
    const content = getModalContent(PLAN_STATUS_MOCKS.starterWithin, SPACE_ID)
    expect(content.cta).toEqual({ label: 'Compare plans', href: billing })
    expect(content.comparison).toBeUndefined()
    expect(content.showSafesSelector).toBe(false)
    expect(content.showPaygFootnote).toBe(false)
  })

  it('upsells Starter → Pro with a comparison when the limit is reached', () => {
    const content = getModalContent(PLAN_STATUS_MOCKS.starterLimit, SPACE_ID)
    expect(content.cta).toEqual({ label: 'Upgrade to Pro', href: billing })
    expect(content.comparison?.activeTierId).toBe('starter')
    expect(content.comparison?.tiers.map((t) => t.id)).toEqual(['starter', 'pro'])
  })

  it('offers "Manage plan" for a Pro within limit', () => {
    const content = getModalContent(PLAN_STATUS_MOCKS.proWithin, SPACE_ID)
    expect(content.cta).toEqual({ label: 'Manage plan', href: billing })
    expect(content.comparison).toBeUndefined()
    expect(content.showSafesSelector).toBe(true)
    expect(content.showPaygFootnote).toBe(true)
  })

  it('upsells Pro → Pro+ with a comparison when approaching the limit', () => {
    const content = getModalContent(PLAN_STATUS_MOCKS.proApproaching, SPACE_ID)
    expect(content.cta).toEqual({ label: 'Upgrade to Pro+', href: billing })
    expect(content.comparison?.activeTierId).toBe('pro')
    expect(content.comparison?.tiers.map((t) => t.id)).toEqual(['pro', 'pro-plus'])
  })

  it('upsells Pro → Pro+ with a comparison when the Pro limit is reached', () => {
    const content = getModalContent(PLAN_STATUS_MOCKS.proLimit, SPACE_ID)
    expect(content.cta).toEqual({ label: 'Upgrade to Pro+', href: billing })
    expect(content.comparison?.activeTierId).toBe('pro')
    expect(content.comparison?.tiers.map((t) => t.id)).toEqual(['pro', 'pro-plus'])
  })

  it('offers "Update payment method" when payment failed', () => {
    const content = getModalContent(PLAN_STATUS_MOCKS.proFailed, SPACE_ID)
    expect(content.cta).toEqual({ label: 'Update payment method', href: billing })
    expect(content.comparison).toBeUndefined()
  })

  it('falls back to the bare billing route when there is no space id', () => {
    const content = getModalContent(PLAN_STATUS_MOCKS.proWithin, null)
    expect(content.cta.href).toBe(AppRoutes.spaces.billing)
  })
})
