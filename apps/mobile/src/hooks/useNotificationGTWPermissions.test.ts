import { renderHook } from '@/src/tests/test-utils'
import { useNotificationGTWPermissions } from './useNotificationGTWPermissions'
import { selectSigners } from '@/src/store/signersSlice'

const mockedState = {
  SafeInfo: {
    address: { value: '0x123' as `0x${string}`, name: 'Test Safe' },
    threshold: 1,
    owners: [{ value: '0x456' as `0x${string}` }],
    fiatTotal: '1000',
    chainId: '1',
    queued: 0,
  },
  signers: {
    '0x456': true,
  },
}

const mockUseAppSelector = jest.fn()

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector),
}))

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: () => ({ address: 'mockAddress' }),
}))

jest.mock('@/src/store/safesSlice')

describe('useNotificationGTWPermissions', () => {
  beforeEach(() => {
    mockUseAppSelector.mockImplementation((selector: unknown) => {
      if (selector === selectSigners) {
        return mockedState.signers
      }
      return {
        '1': mockedState.SafeInfo,
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns the correct account type for an owner', () => {
    const { result } = renderHook(() => useNotificationGTWPermissions('0x123', '1'))
    const { ownerFound, accountType } = result.current.getAccountType()
    expect(ownerFound).toEqual({ value: '0x456' })
    expect(accountType).toBe('OWNER')
  })

  it('returns the correct account type for a regular user', () => {
    mockUseAppSelector.mockImplementation((selector: unknown) => {
      if (selector === selectSigners) {
        return {} // No signers
      }
      return {
        '1': {
          ...mockedState.SafeInfo,
          owners: [{ value: '0x789' }],
        },
      }
    })

    const { result } = renderHook(() => useNotificationGTWPermissions('0x123', '1'))
    const { ownerFound, accountType } = result.current.getAccountType()
    expect(ownerFound).toBeNull()
    expect(accountType).toBe('REGULAR')
  })
})
