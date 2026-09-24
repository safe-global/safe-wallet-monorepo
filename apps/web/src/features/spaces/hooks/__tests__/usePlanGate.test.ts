import { renderHook } from '@testing-library/react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { usePlanGate } from '../usePlanGate'

const SPACE_ID = 'space-1'
const PLANS_HREF = { pathname: '/spaces/plans', query: { spaceId: SPACE_ID } }

let mockFlags: FEATURES[] = []
let mockCurrentSpaceId: string | null = SPACE_ID
const mockUseSpaceEntitlements = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: (feature: FEATURES) => mockFlags.includes(feature) }))
jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => mockCurrentSpaceId }))
jest.mock('../billing/useSpaceEntitlements', () => ({
  useSpaceEntitlements: (spaceId: string | null) => mockUseSpaceEntitlements(spaceId),
}))

const entitlements = (granted: string[], isLoading = false) => ({
  isEntitled: (feature: string) => granted.includes(feature),
  isLoading,
})

describe('usePlanGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFlags = [FEATURES.SAFE_PRO, FEATURES.PROPOSER_GATING]
    mockCurrentSpaceId = SPACE_ID
    mockUseSpaceEntitlements.mockReturnValue(entitlements([]))
  })

  it.each([
    ['SAFE_PRO is off', [FEATURES.PROPOSER_GATING]],
    ['the gating flag is off', [FEATURES.SAFE_PRO]],
    ['only another feature is gated', [FEATURES.SAFE_PRO, FEATURES.SPENDING_LIMIT_GATING]],
  ])('changes nothing and skips the entitlements while %s', (_, flags) => {
    mockFlags = flags

    const { result } = renderHook(() => usePlanGate(FEATURES.PROPOSER_GATING))

    expect(result.current).toEqual({ isBlocked: false, isLoading: false, upgradeHref: PLANS_HREF })
    expect(mockUseSpaceEntitlements).toHaveBeenCalledWith(null)
  })

  it('reads the plan of the active Workspace and blocks while it lacks the entitlement', () => {
    const { result } = renderHook(() => usePlanGate(FEATURES.PROPOSER_GATING))

    expect(mockUseSpaceEntitlements).toHaveBeenCalledWith(SPACE_ID)
    expect(result.current).toEqual({ isBlocked: true, isLoading: false, upgradeHref: PLANS_HREF })
  })

  it('opens once the active Workspace plan grants the entitlement', () => {
    mockUseSpaceEntitlements.mockReturnValue(entitlements(['policies']))

    const { result } = renderHook(() => usePlanGate(FEATURES.PROPOSER_GATING))

    expect(result.current.isBlocked).toBe(false)
  })

  it('neither blocks nor opens while the entitlements load', () => {
    mockUseSpaceEntitlements.mockReturnValue(entitlements([], true))

    const { result } = renderHook(() => usePlanGate(FEATURES.PROPOSER_GATING))

    expect(result.current).toMatchObject({ isBlocked: false, isLoading: true })
  })

  it('blocks without an active Workspace and leads to Workspaces instead', () => {
    mockCurrentSpaceId = null

    const { result } = renderHook(() => usePlanGate(FEATURES.PROPOSER_GATING))

    expect(result.current).toEqual({ isBlocked: true, isLoading: false, upgradeHref: '/welcome/spaces' })
  })
})
