import { renderHook } from '@/tests/test-utils'
import { useIsOutreachSafe } from '@/features/targeted-features'
import { useIsHypernativeGuard } from '../useIsHypernativeGuard'
import { HYPERNATIVE_ALLOWLIST_OUTREACH_ID } from '../../constants'
import { useIsHypernativeEligible } from '../useIsHypernativeEligible'

jest.mock('@/features/targeted-features', () => ({
  useIsOutreachSafe: jest.fn(),
}))
jest.mock('../useIsHypernativeGuard')

const mockUseIsOutreachSafe = useIsOutreachSafe as jest.MockedFunction<typeof useIsOutreachSafe>
const mockUseIsHypernativeGuard = useIsHypernativeGuard as jest.MockedFunction<typeof useIsHypernativeGuard>

describe('useIsHypernativeEligible', () => {
  beforeEach(() => {
    mockUseIsOutreachSafe.mockReturnValue({ isTargeted: false, loading: false })
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: false })
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

    expect(mockUseIsOutreachSafe).toHaveBeenCalledWith(HYPERNATIVE_ALLOWLIST_OUTREACH_ID)
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
})
