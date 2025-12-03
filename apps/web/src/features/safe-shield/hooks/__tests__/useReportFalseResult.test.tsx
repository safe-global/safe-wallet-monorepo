import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { ReactNode } from 'react'

// Mock the RTK query mutation hook
const mockTriggerReport = jest.fn()
const mockUnwrap = jest.fn()

jest.mock('../../../../../../../packages/store/src/gateway/AUTO_GENERATED/safe-shield', () => ({
  useSafeShieldReportFalseResultV1Mutation: () => [
    (...args: unknown[]) => {
      mockTriggerReport(...args)
      return { unwrap: mockUnwrap }
    },
    { isLoading: false },
  ],
}))

// Mock useSafeInfo
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({
    safe: { chainId: '1' },
    safeAddress: '0x1234567890123456789012345678901234567890',
  }),
}))

// Mock analytics
const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

// Import after mocks
import { useReportFalseResult } from '../useReportFalseResult'

// Create a minimal store for testing
const createTestStore = () =>
  configureStore({
    reducer: {
      notifications: (state = []) => state,
    },
  })

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={createTestStore()}>{children}</Provider>

describe('useReportFalseResult', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return reportFalseResult function and isLoading state', () => {
    const { result } = renderHook(() => useReportFalseResult(), { wrapper })

    expect(result.current.reportFalseResult).toBeDefined()
    expect(typeof result.current.reportFalseResult).toBe('function')
    expect(result.current.isLoading).toBe(false)
  })

  it('should call the mutation with correct parameters on success', async () => {
    mockUnwrap.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useReportFalseResult(), { wrapper })

    let success: boolean = false
    await act(async () => {
      success = await result.current.reportFalseResult({
        event: 'FALSE_POSITIVE',
        requestId: 'test-request-id',
        details: 'Test details',
      })
    })

    expect(success).toBe(true)
    expect(mockTriggerReport).toHaveBeenCalledWith({
      chainId: '1',
      safeAddress: '0x1234567890123456789012345678901234567890',
      reportFalseResultRequestDto: {
        event: 'FALSE_POSITIVE',
        request_id: 'test-request-id',
        details: 'Test details',
      },
    })
  })

  it('should track analytics event on success', async () => {
    mockUnwrap.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useReportFalseResult(), { wrapper })

    await act(async () => {
      await result.current.reportFalseResult({
        event: 'FALSE_POSITIVE',
        requestId: 'test-request-id',
        details: 'Test details',
      })
    })

    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'Report submitted' }), {
      event: 'FALSE_POSITIVE',
    })
  })

  it('should return false and track error on failure', async () => {
    mockUnwrap.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useReportFalseResult(), { wrapper })

    let success: boolean = true
    await act(async () => {
      success = await result.current.reportFalseResult({
        event: 'FALSE_POSITIVE',
        requestId: 'test-request-id',
        details: 'Test details',
      })
    })

    expect(success).toBe(false)
    expect(mockTrackEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'Report submission failed' }), {
      event: 'FALSE_POSITIVE',
    })
  })

  it('should return false when API returns success: false', async () => {
    mockUnwrap.mockResolvedValueOnce({ success: false })

    const { result } = renderHook(() => useReportFalseResult(), { wrapper })

    let success: boolean = true
    await act(async () => {
      success = await result.current.reportFalseResult({
        event: 'FALSE_POSITIVE',
        requestId: 'test-request-id',
        details: 'Test details',
      })
    })

    expect(success).toBe(false)
  })
})
