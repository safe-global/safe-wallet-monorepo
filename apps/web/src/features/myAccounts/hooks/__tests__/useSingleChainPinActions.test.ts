import { renderHook } from '@/tests/test-utils'
import { useSingleChainPinActions } from '../useSingleChainPinActions'
import * as analytics from '@/services/analytics'
import type { RootState } from '@/store'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockAddress = '0x1234567890123456789012345678901234567890'
const mockChainId = '1'
const mockOwners = [{ value: '0xowner1' }, { value: '0xowner2' }]

describe('useSingleChainPinActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return handlePinClick function', () => {
    const { result } = renderHook(() =>
      useSingleChainPinActions({
        address: mockAddress,
        chainId: mockChainId,
        isPinned: false,
        threshold: 2,
        owners: mockOwners,
      }),
    )

    expect(result.current.handlePinClick).toBeDefined()
    expect(typeof result.current.handlePinClick).toBe('function')
  })

  it('should track pin event when clicking on unpinned safe', () => {
    const { result } = renderHook(
      () =>
        useSingleChainPinActions({
          address: mockAddress,
          chainId: mockChainId,
          isPinned: false,
          threshold: 2,
          owners: mockOwners,
        }),
      {
        initialReduxState: {
          addedSafes: {},
        } as unknown as Partial<RootState>,
      },
    )

    const mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent

    result.current.handlePinClick(mockEvent)

    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'pin',
      }),
    )
  })

  it('should track unpin event when clicking on pinned safe', () => {
    const { result } = renderHook(
      () =>
        useSingleChainPinActions({
          address: mockAddress,
          chainId: mockChainId,
          isPinned: true,
          threshold: 2,
          owners: mockOwners,
        }),
      {
        initialReduxState: {
          addedSafes: {
            [mockChainId]: {
              [mockAddress]: {
                owners: mockOwners,
                threshold: 2,
              },
            },
          },
        } as Partial<RootState>,
      },
    )

    const mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent

    result.current.handlePinClick(mockEvent)

    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'unpin',
      }),
    )
  })

  it('should stop event propagation', () => {
    const { result } = renderHook(() =>
      useSingleChainPinActions({
        address: mockAddress,
        chainId: mockChainId,
        isPinned: false,
        threshold: 2,
        owners: mockOwners,
      }),
    )

    const mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent

    result.current.handlePinClick(mockEvent)

    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })
})
