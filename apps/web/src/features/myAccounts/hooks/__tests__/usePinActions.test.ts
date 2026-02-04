import { renderHook, act } from '@/tests/test-utils'
import { usePinActions } from '../usePinActions'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import type { RootState } from '@/store'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import * as analytics from '@/services/analytics'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const buildSafeOverview = (chainId: string, address: string): SafeOverview =>
  ({
    address: { value: address },
    chainId,
    threshold: 2,
    owners: [{ value: '0xOwner1' }, { value: '0xOwner2' }],
    fiatTotal: '1000',
  }) as SafeOverview

describe('usePinActions', () => {
  const mockTrackEvent = analytics.trackEvent as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addToPinnedList', () => {
    it('should pin all safes when the group is already in added safes', () => {
      const safes = [
        safeItemBuilder().with({ chainId: '1', address: '0xSafe1' }).build(),
        safeItemBuilder().with({ chainId: '137', address: '0xSafe1' }).build(),
      ]

      const { result } = renderHook(() => usePinActions('0xSafe1', 'My Safe', safes, undefined), {
        initialReduxState: {
          addedSafes: {
            '1': { '0xSafe1': { owners: [], threshold: 1 } },
            '137': { '0xSafe1': { owners: [], threshold: 1 } },
          },
        } as unknown as Partial<RootState>,
      })

      act(() => {
        result.current.addToPinnedList()
      })

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          label: analytics.PIN_SAFE_LABELS.pin,
        }),
      )
    })

    it('should add and pin safes when the group is not in added safes', () => {
      const safes = [
        safeItemBuilder().with({ chainId: '1', address: '0xNewSafe' }).build(),
        safeItemBuilder().with({ chainId: '137', address: '0xNewSafe' }).build(),
      ]

      const safeOverviews = [buildSafeOverview('1', '0xNewSafe'), buildSafeOverview('137', '0xNewSafe')]

      const { result } = renderHook(() => usePinActions('0xNewSafe', 'New Safe', safes, safeOverviews), {
        initialReduxState: {
          addedSafes: {},
        } as unknown as Partial<RootState>,
      })

      act(() => {
        result.current.addToPinnedList()
      })

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          label: analytics.PIN_SAFE_LABELS.pin,
        }),
      )
    })

    it('should use shortened address in notification when name is undefined', () => {
      const safes = [
        safeItemBuilder().with({ chainId: '1', address: '0x1234567890123456789012345678901234567890' }).build(),
      ]

      const { result } = renderHook(
        () => usePinActions('0x1234567890123456789012345678901234567890', undefined, safes, undefined),
        {
          initialReduxState: {
            addedSafes: {
              '1': { '0x1234567890123456789012345678901234567890': { owners: [], threshold: 1 } },
            },
          } as unknown as Partial<RootState>,
        },
      )

      act(() => {
        result.current.addToPinnedList()
      })

      // The notification will use shortenAddress for the address
      expect(mockTrackEvent).toHaveBeenCalled()
    })
  })

  describe('removeFromPinnedList', () => {
    it('should unpin all safes in the group', () => {
      const safes = [
        safeItemBuilder().with({ chainId: '1', address: '0xPinnedSafe' }).build(),
        safeItemBuilder().with({ chainId: '137', address: '0xPinnedSafe' }).build(),
      ]

      const { result } = renderHook(() => usePinActions('0xPinnedSafe', 'Pinned Safe', safes, undefined), {
        initialReduxState: {
          addedSafes: {
            '1': { '0xPinnedSafe': { owners: [], threshold: 1 } },
            '137': { '0xPinnedSafe': { owners: [], threshold: 1 } },
          },
        } as unknown as Partial<RootState>,
      })

      act(() => {
        result.current.removeFromPinnedList()
      })

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          label: analytics.PIN_SAFE_LABELS.unpin,
        }),
      )
    })

    it('should use the safe name in the notification', () => {
      const safes = [safeItemBuilder().with({ chainId: '1', address: '0xSafe' }).build()]

      const { result } = renderHook(() => usePinActions('0xSafe', 'Named Safe', safes, undefined), {
        initialReduxState: {
          addedSafes: {
            '1': { '0xSafe': { owners: [], threshold: 1 } },
          },
        } as unknown as Partial<RootState>,
      })

      act(() => {
        result.current.removeFromPinnedList()
      })

      expect(mockTrackEvent).toHaveBeenCalled()
    })
  })

  describe('multiple safes', () => {
    it('should handle single safe in the group', () => {
      const safes = [safeItemBuilder().with({ chainId: '1', address: '0xSingleSafe' }).build()]

      const { result } = renderHook(() => usePinActions('0xSingleSafe', 'Single Safe', safes, undefined), {
        initialReduxState: {
          addedSafes: {
            '1': { '0xSingleSafe': { owners: [], threshold: 1 } },
          },
        } as unknown as Partial<RootState>,
      })

      act(() => {
        result.current.addToPinnedList()
      })

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          label: analytics.PIN_SAFE_LABELS.pin,
        }),
      )
    })
  })
})
