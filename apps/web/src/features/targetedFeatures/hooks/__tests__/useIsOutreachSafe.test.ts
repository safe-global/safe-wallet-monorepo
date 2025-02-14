import { faker } from '@faker-js/faker'
import * as targetedMessages from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'

import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { renderHook } from '@/tests/test-utils'
import { useIsOutreachSafe } from '../useIsOutreachSafe'

describe('useIsOutreachSafe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true if the Safe is targeted for messaging', () => {
    const safeInfo = safeInfoBuilder().build()
    const outreachId = faker.number.int()
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safeAddress: safeInfo.address.value,
      safe: {
        ...safeInfo,
        deployed: true,
      },
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
    jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
      data: {
        outreachId,
        address: safeInfo.address.value,
      },
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useIsOutreachSafe(outreachId))

    expect(result.current).toBe(true)
  })

  it('returns false if the Safe is not targeted for messaging', () => {
    const safeInfo = safeInfoBuilder().build()
    const outreachId = faker.number.int()
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safeAddress: safeInfo.address.value,
      safe: {
        ...safeInfo,
        deployed: true,
      },
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
    jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
      data: undefined,
      error: new Error('Safe not targeted'),
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useIsOutreachSafe(outreachId))

    expect(result.current).toBe(false)
  })

  it('returns false if the data is not available', () => {
    const safeInfo = safeInfoBuilder().build()
    const outreachId = faker.number.int()
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safeAddress: safeInfo.address.value,
      safe: {
        ...safeInfo,
        deployed: true,
      },
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
    jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
      data: undefined, // Yet to be fetched
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useIsOutreachSafe(outreachId))

    expect(result.current).toBe(false)
  })

  it('returns false if the outreachId does not match', () => {
    const safeInfo = safeInfoBuilder().build()
    const outreachId = faker.number.int()
    const otherOutreachId = 'OTHER_FEATURE'
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safeAddress: safeInfo.address.value,
      safe: {
        ...safeInfo,
        deployed: true,
      },
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
    jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
      data: {
        outreachId: otherOutreachId,
        address: safeInfo.address.value,
      },
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useIsOutreachSafe(outreachId))

    expect(result.current).toBe(false)
  })

  it('returns false if the address does not match', () => {
    const safeInfo = safeInfoBuilder().build()
    const otherAddress = faker.finance.ethereumAddress()
    const outreachId = faker.number.int()
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safeAddress: safeInfo.address.value,
      safe: {
        ...safeInfo,
        deployed: true,
      },
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
    jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
      data: {
        outreachId,
        address: otherAddress,
      },
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useIsOutreachSafe(outreachId))

    expect(result.current).toBe(false)
  })
})
