import { renderHook } from '@/tests/test-utils'
import { useIsOutreachSafe } from '@/features/targeted-features'
import { useIsHypernativeGuard } from '../useIsHypernativeGuard'
import { useIsHypernativeFeature } from '../useIsHypernativeFeature'
import { HYPERNATIVE_ALLOWLIST_OUTREACH_ID } from '../../constants'
import { useIsHypernativeEligible } from '../useIsHypernativeEligible'

jest.mock('@/features/targeted-features', () => ({
  useIsOutreachSafe: jest.fn(),
}))
jest.mock('../useIsHypernativeGuard')
jest.mock('../useIsHypernativeFeature')

const mockUseIsOutreachSafe = useIsOutreachSafe as jest.MockedFunction<typeof useIsOutreachSafe>
const mockUseIsHypernativeGuard = useIsHypernativeGuard as jest.MockedFunction<typeof useIsHypernativeGuard>
const mockUseIsHypernativeFeature = useIsHypernativeFeature as jest.MockedFunction<typeof useIsHypernativeFeature>

describe('useIsHypernativeEligible', () => {
  beforeEach(() => {
    mockUseIsOutreachSafe.mockReturnValue({ isTargeted: false, loading: false })
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: false })
    mockUseIsHypernativeFeature.mockReturnValue(true)
  })

  it('returns eligible when guard is installed and prerequisites are met', () => {
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: true, loading: false })

    const { result } = renderHook(() => useIsHypernativeEligible())

    expect(result.current.isHypernativeEligible).toBe(true)
    expect(result.current.isHypernativeGuard).toBe(true)
    expect(result.current.isAllowlistedSafe).toBe(false)
  })

  it('returns eligible when Safe is targeted and prerequisites are met', () => {
    mockUseIsOutreachSafe.mockReturnValue({ isTargeted: true, loading: false })

    const { result } = renderHook(() => useIsHypernativeEligible())

    expect(result.current.isHypernativeEligible).toBe(true)
    expect(result.current.isHypernativeGuard).toBe(false)
    expect(result.current.isAllowlistedSafe).toBe(true)
  })

  it('returns ineligible when neither guard nor targeting applies', () => {
    const { result } = renderHook(() => useIsHypernativeEligible())

    expect(result.current.isHypernativeEligible).toBe(false)
    expect(result.current.isHypernativeGuard).toBe(false)
    expect(result.current.isAllowlistedSafe).toBe(false)
  })

  it('passes the login outreach ID to targeted messaging', () => {
    renderHook(() => useIsHypernativeEligible())

    expect(mockUseIsOutreachSafe).toHaveBeenCalledWith(HYPERNATIVE_ALLOWLIST_OUTREACH_ID, { skip: false })
  })

  it('exposes guard loading state', () => {
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: true })

    const { result } = renderHook(() => useIsHypernativeEligible())

    expect(result.current.loading).toBe(true)
  })

  it('exposes outreach loading state', () => {
    mockUseIsOutreachSafe.mockReturnValue({ isTargeted: false, loading: true })

    const { result } = renderHook(() => useIsHypernativeEligible())

    expect(result.current.loading).toBe(true)
  })

  // The targeted-messaging probe answers 404 for every Safe outside the
  // outreach, and the browser logs that 404 to the console itself — no JS
  // filter can suppress it (WA-2991). With HYPERNATIVE off on the chain the
  // answer cannot make a Safe eligible, so we must not ask.
  describe('when the Hypernative feature is disabled on the chain', () => {
    beforeEach(() => {
      mockUseIsHypernativeFeature.mockReturnValue(false)
    })

    it('skips the outreach probe', () => {
      renderHook(() => useIsHypernativeEligible())

      expect(mockUseIsOutreachSafe).toHaveBeenCalledWith(HYPERNATIVE_ALLOWLIST_OUTREACH_ID, { skip: true })
    })

    it('still reports eligibility from an installed guard', () => {
      mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: true, loading: false })

      const { result } = renderHook(() => useIsHypernativeEligible())

      expect(result.current.isHypernativeGuard).toBe(true)
      expect(result.current.isHypernativeEligible).toBe(true)
    })
  })
})
