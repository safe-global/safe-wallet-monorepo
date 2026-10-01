import { renderHook } from '@testing-library/react'
import useTrialOfferReturn from '../useTrialOfferReturn'

const mockReplace = jest.fn()
let mockQuery: Record<string, string> = {}
let mockLock = { isLocked: false, reason: 'lapsed' }

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: mockReplace, query: mockQuery }),
}))

jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeQueryParam: () => mockQuery.safe ?? '',
}))

jest.mock('../../../../hooks/useWorkspaceLock', () => ({
  useWorkspaceLock: () => mockLock,
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('useTrialOfferReturn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = { spaceId: SPACE_ID }
    mockLock = { isLocked: false, reason: 'lapsed' }
  })

  it('sends a Workspace still waiting on its trial back to the trial offer', () => {
    mockQuery = { spaceId: SPACE_ID, next: '/balances', safe: '1:0xdeadbeef' }
    mockLock = { isLocked: true, reason: 'trial-offered' }

    renderHook(() => useTrialOfferReturn(SPACE_ID))

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/welcome/create-space',
      query: { createdSpaceId: SPACE_ID, safe: '1:0xdeadbeef', next: '/balances' },
    })
  })

  it('stays while a checkout return is being confirmed', () => {
    mockQuery = { spaceId: SPACE_ID, sessionId: 'cs_test_123' }
    mockLock = { isLocked: true, reason: 'trial-offered' }

    renderHook(() => useTrialOfferReturn(SPACE_ID))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('stays when the Workspace has a live plan', () => {
    renderHook(() => useTrialOfferReturn(SPACE_ID))

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('stays when the Workspace is locked for another reason', () => {
    mockLock = { isLocked: true, reason: 'payment-failed' }

    renderHook(() => useTrialOfferReturn(SPACE_ID))

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
