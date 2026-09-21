import { renderHook } from '@testing-library/react-native'
import { useWcReviewAbandon } from '../useWcReviewAbandon'
import { markReviewAbandoned } from '../../store/walletKitSlice'

const HASH = '0xabc'
const NAV_ACTION = { type: 'POP' }

// Capture usePreventRemove's args so the test can drive the back-out callback.
let mockPreventArg: boolean | undefined
let mockPreventCb: ((options: { data: { action: unknown } }) => void) | undefined
jest.mock('@react-navigation/native', () => ({
  usePreventRemove: (prevent: boolean, cb: (options: { data: { action: unknown } }) => void) => {
    mockPreventArg = prevent
    mockPreventCb = cb
  },
}))

const mockNavDispatch = jest.fn()
jest.mock('expo-router', () => ({ useNavigation: () => ({ dispatch: mockNavDispatch }) }))

const mockDispatch = jest.fn()
let mockOutstanding: unknown
jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => selector({}),
}))
jest.mock('../../store/walletKitSlice', () => ({
  ...jest.requireActual('../../store/walletKitSlice'),
  selectOutstandingRequestByHash: () => mockOutstanding,
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockPreventArg = undefined
  mockPreventCb = undefined
  mockOutstanding = undefined
})

describe('useWcReviewAbandon', () => {
  it('arms the intercept while an outstanding WC request exists', () => {
    mockOutstanding = { topic: 't', id: 1 }
    renderHook(() => useWcReviewAbandon(HASH))
    expect(mockPreventArg).toBe(true)
  })

  it('does not arm the intercept for a non-WC tx (no outstanding request)', () => {
    mockOutstanding = undefined
    renderHook(() => useWcReviewAbandon(HASH))
    expect(mockPreventArg).toBe(false)
  })

  it('dispatches markReviewAbandoned and re-dispatches the nav action on back-out', () => {
    mockOutstanding = { topic: 't', id: 1 }
    renderHook(() => useWcReviewAbandon(HASH))

    mockPreventCb?.({ data: { action: NAV_ACTION } })

    expect(mockDispatch).toHaveBeenCalledWith(markReviewAbandoned({ safeTxHash: HASH }))
    expect(mockNavDispatch).toHaveBeenCalledWith(NAV_ACTION)
  })
})
