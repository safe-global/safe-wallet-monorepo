import { renderHook, RootState } from '@/src/tests/test-utils'
import { useNotificationGTWPermissions } from './useNotificationGTWPermissions'
import { selectSigners } from '@/src/store/signersSlice'

const mockUseAppSelector = jest.fn()

const mockedSafeInfo = {
  address: { value: '0x123' as `0x${string}`, name: 'Test Safe' },
  threshold: 1,
  owners: [{ value: '0x456' as `0x${string}` }],
  fiatTotal: '1000',
  chainId: '1',
  queued: 0,
}
const mockState = {
  safes: {
    [mockedSafeInfo.address.value]: {
      [mockedSafeInfo.chainId]: {
        ...mockedSafeInfo,
      },
    },
  },
  signers: {
    [mockedSafeInfo.owners[0].value]: {
      address: mockedSafeInfo.owners[0].value,
      name: 'Test Safe',
    },
  },
  settings: {
    themePreference: 'auto',
  },
  notifications: {
    isAppNotificationsEnabled: true,
    isDeviceNotificationsEnabled: true,
  },
  activeSafe: {
    address: mockedSafeInfo.address.value,
    chainId: mockedSafeInfo.chainId,
  },
} as unknown as RootState
describe('useNotificationGTWPermissions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns the correct account type for an owner', () => {
    const { result } = renderHook(() => useNotificationGTWPermissions('0x123', '1'), mockState)
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
        SafeInfo: {
          ...mockedSafeInfo,
          owners: [{ value: '0x789' }], // Owner that isn't a signer
        },
      }
    })

    const { result } = renderHook(() => useNotificationGTWPermissions('0x123'))
    const { ownerFound, accountType } = result.current.getAccountType()
    expect(ownerFound).toBeNull()
    expect(accountType).toBe('REGULAR')
  })
})
