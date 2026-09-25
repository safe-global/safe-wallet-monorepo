import { renderHook } from '@testing-library/react'
import { canRelayWith, useSafeSponsoredTxs, type SafeSponsoredTxs } from '../useSafeSponsoredTxs'

const mockUseSafeProAccess = jest.fn()
const mockUseSpacePlan = jest.fn()
jest.mock('../useSafeProAccess', () => ({ useSafeProAccess: () => mockUseSafeProAccess() }))
jest.mock('../useSpacePlan', () => ({ useSpacePlan: (spaceId: string | null) => mockUseSpacePlan(spaceId) }))

const ACCESS = { isSafePro: true, hasProFeatures: true, spaceId: 'space-1', isLoading: false }
const meter = { used: 20, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' }

describe('useSafeSponsoredTxs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeProAccess.mockReturnValue(ACCESS)
    mockUseSpacePlan.mockReturnValue({ sponsoredTxs: meter })
  })

  it('reads the allowance of the Workspace the Safe belongs to', () => {
    const { result } = renderHook(() => useSafeSponsoredTxs())

    expect(mockUseSpacePlan).toHaveBeenCalledWith('space-1')
    expect(result.current).toEqual({
      isEnabled: true,
      isPro: true,
      meter,
      left: 30,
      spaceId: 'space-1',
      canSponsor: true,
      isExhausted: false,
      isLoading: false,
    })
  })

  it('caps the count at zero and reads a missing quota as unlimited', () => {
    mockUseSpacePlan.mockReturnValue({ sponsoredTxs: { ...meter, used: 60 } })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({
      left: 0,
      canSponsor: false,
      isExhausted: true,
    })

    mockUseSpacePlan.mockReturnValue({ sponsoredTxs: { ...meter, quota: null } })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({
      isPro: true,
      left: null,
      canSponsor: true,
      isExhausted: false,
    })
  })

  it('is not Pro for a Safe outside the Workspace, or in one without a live plan', () => {
    mockUseSafeProAccess.mockReturnValue({ ...ACCESS, hasProFeatures: false, spaceId: null })
    mockUseSpacePlan.mockReturnValue({ sponsoredTxs: null })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({
      isEnabled: true,
      isPro: false,
      meter: null,
      left: null,
      spaceId: null,
      canSponsor: false,
      isExhausted: false,
    })
    expect(mockUseSpacePlan).toHaveBeenCalledWith(null)

    mockUseSafeProAccess.mockReturnValue({ ...ACCESS, hasProFeatures: false })
    mockUseSpacePlan.mockReturnValue({ sponsoredTxs: meter })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toMatchObject({ isPro: false, spaceId: null })
  })

  it('stays off while SAFE_PRO is off, though the access check then opens everything', () => {
    mockUseSafeProAccess.mockReturnValue({ isSafePro: false, hasProFeatures: true, spaceId: null, isLoading: false })
    mockUseSpacePlan.mockReturnValue({ sponsoredTxs: null })

    expect(renderHook(() => useSafeSponsoredTxs()).result.current).toEqual({
      isEnabled: false,
      isPro: false,
      meter: null,
      left: null,
      spaceId: null,
      canSponsor: false,
      isExhausted: false,
      isLoading: false,
    })
  })

  it('reports loading while the Workspace membership or plan resolves', () => {
    mockUseSafeProAccess.mockReturnValue({ ...ACCESS, isLoading: true })
    expect(renderHook(() => useSafeSponsoredTxs()).result.current.isLoading).toBe(true)
  })
})

describe('canRelayWith', () => {
  const relays = { remaining: 3, limit: 5 }
  const sponsored = (isPro: boolean, canSponsor: boolean): SafeSponsoredTxs => ({
    isEnabled: true,
    isPro,
    meter: null,
    left: null,
    spaceId: null,
    canSponsor,
    isExhausted: false,
    isLoading: false,
  })

  it("relays a Safe on a plan against its Workspace's allowance only", () => {
    expect(canRelayWith(sponsored(true, true), undefined)).toBe(true)
    expect(canRelayWith(sponsored(true, false), relays)).toBe(false)
  })

  it("relays any other Safe against the chain's daily relays", () => {
    expect(canRelayWith(sponsored(false, false), relays)).toBe(true)
    expect(canRelayWith(sponsored(false, false), { ...relays, remaining: 0 })).toBe(false)
    expect(canRelayWith(sponsored(false, false), undefined)).toBe(false)
  })
})
