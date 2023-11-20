import { useWeb3ReadOnly } from '@/hooks/wallets/web3'

import { useBlockTimestamp } from '@/hooks/useBlockTimestamp'
import { renderHook, waitFor } from '@/tests/test-utils'

jest.mock('@/hooks/wallets/web3')

const mockUseWeb3ReadOnly = useWeb3ReadOnly as jest.MockedFunction<typeof useWeb3ReadOnly>

describe('useBlockTimestamp', () => {
  const mockGetBlock = jest.fn()

  beforeEach(() => {
    mockUseWeb3ReadOnly.mockReturnValue({
      getBlock: mockGetBlock,
    } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return undefined if web3ReadOnly is not available', () => {
    mockUseWeb3ReadOnly.mockReturnValue(undefined)

    const { result } = renderHook(() => useBlockTimestamp())

    expect(result.current).toBeUndefined()

    expect(mockGetBlock).not.toHaveBeenCalled()
  })

  it('should return the latest block timestamp', async () => {
    const timestamp = 69420

    mockGetBlock.mockResolvedValue({
      timestamp,
    } as any)

    const { result } = renderHook(() => useBlockTimestamp())

    expect(result.current).toBeUndefined()

    await waitFor(() => {
      expect(result.current).toBe(timestamp)
    })

    expect(mockGetBlock).toHaveBeenCalledTimes(1)
  })

  it('should update the timestamp every INTERVAL', async () => {
    jest.useFakeTimers()

    const timestamp = 69420

    mockGetBlock.mockResolvedValue({
      timestamp,
    } as any)

    const { result } = renderHook(() => useBlockTimestamp())

    expect(result.current).toBeUndefined()

    await waitFor(() => {
      expect(result.current).toBe(timestamp)
    })

    jest.advanceTimersByTime(1_000)

    await waitFor(() => {
      expect(result.current).toBe(timestamp + 1)
    })

    jest.advanceTimersByTime(1_000)

    await waitFor(() => {
      expect(result.current).toBe(timestamp + 2)
    })

    // Interval is used to update the timestamp after initial getBlock call
    expect(mockGetBlock).toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })
})
