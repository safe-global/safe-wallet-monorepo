import { act, renderHook } from '@testing-library/react'
import { useSeatTrim } from '../useSeatTrim'

const mockRemoveSafes = jest.fn()
let mockRemoveState: Record<string, unknown> = {}
let mockSafes: { safes: Record<string, string[]> } = { safes: {} }
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: () => ({ currentData: mockSafes }),
  useSpaceSafesDeleteV1Mutation: () => [mockRemoveSafes, { isLoading: false, error: undefined, ...mockRemoveState }],
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('useSeatTrim', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRemoveState = {}
    mockRemoveSafes.mockResolvedValue({ data: undefined })
    mockSafes = { safes: { '1': ['0xA', '0xB'], '10': ['0xC'] } }
  })

  it('counts the Workspace seats across chains and asks to trim only when the plan covers fewer', () => {
    const { result } = renderHook(() => useSeatTrim(SPACE_ID))

    expect(result.current.seatCount).toBe(3)
    expect(result.current.needsTrim(2)).toBe(true)
    expect(result.current.needsTrim(3)).toBe(false)
    expect(result.current.needsTrim(null)).toBe(false)
    expect(result.current.needsTrim(undefined)).toBe(false)
  })

  it('counts a Safe deployed on several chains as one seat', () => {
    mockSafes = { safes: { '1': ['0xA', '0xB'], '10': ['0xa'] } }
    const { result } = renderHook(() => useSeatTrim(SPACE_ID))

    expect(result.current.seatCount).toBe(2)
    expect(result.current.needsTrim(2)).toBe(false)
  })

  it('removes the Safes left out and reports whether the removal went through', async () => {
    const { result } = renderHook(() => useSeatTrim(SPACE_ID))

    let ok = false
    await act(async () => {
      ok = await result.current.trim([{ chainId: '10', address: '0xC' }])
    })
    expect(ok).toBe(true)
    expect(mockRemoveSafes).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      deleteSpaceSafesDto: { safes: [{ chainId: '10', address: '0xC' }] },
    })

    mockRemoveSafes.mockResolvedValue({ error: { status: 500 } })
    await act(async () => {
      ok = await result.current.trim([{ chainId: '1', address: '0xA' }])
    })
    expect(ok).toBe(false)
  })

  it('skips the request when nothing is removed', async () => {
    const { result } = renderHook(() => useSeatTrim(SPACE_ID))

    let ok = false
    await act(async () => {
      ok = await result.current.trim([])
    })
    expect(ok).toBe(true)
    expect(mockRemoveSafes).not.toHaveBeenCalled()
  })

  it('words the removal error', () => {
    expect(renderHook(() => useSeatTrim(SPACE_ID)).result.current.error).toBeUndefined()

    mockRemoveState = { error: { status: 500, data: { message: 'Boom' } } }
    expect(renderHook(() => useSeatTrim(SPACE_ID)).result.current.error).toBe('Boom')
  })
})
