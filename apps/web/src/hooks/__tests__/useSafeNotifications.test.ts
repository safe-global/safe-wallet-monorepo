import { renderHook } from '@/tests//test-utils'
import useSafeNotifications from '../../hooks/useSafeNotifications'
import useSafeInfo from '../../hooks/useSafeInfo'
import { showNotification } from '@/store/notificationsSlice'
import { isMigrationToL2Possible } from '@/services/contracts/safeContracts'
import { safeInfoBuilder } from '@/tests/builders/safe'

// mock showNotification
jest.mock('@/store/notificationsSlice', () => {
  const original = jest.requireActual('@/store/notificationsSlice')
  return {
    ...original,
    showNotification: jest.fn(original.showNotification),
  }
})

// mock useSafeInfo
jest.mock('../../hooks/useSafeInfo')

// mock useIsSafeOwner
jest.mock('../../hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}))

// mock router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    query: { safe: 'eth:0x123' },
  })),
}))

describe('useSafeNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Safe upgrade', () => {
    it('should show a notification when the Safe version is out of date', () => {
      // mock useSafeInfo to return a SafeInfo with an outdated version
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: {
          implementation: { value: '0x123' },
          implementationVersionState: 'OUTDATED',
          version: '1.1.1',
        },
        safeAddress: '0x123',
      })

      // render the hook
      const { result } = renderHook(() => useSafeNotifications())

      // check that the notification was shown
      expect(result.current).toBeUndefined()
      expect(showNotification).toHaveBeenCalledWith({
        variant: 'warning',
        message: `Your Safe version 1.1.1 is out of date. Please update it.`,
        groupKey: 'safe-outdated-version',
        link: {
          href: {
            pathname: '/settings/setup',
            query: { safe: 'eth:0x123' },
          },
          title: 'Update Safe',
        },
      })
    })

    it('should show a notification for legacy Safes', () => {
      // mock useSafeInfo to return a SafeInfo with an outdated version
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: {
          implementation: { value: '0x123' },
          implementationVersionState: 'OUTDATED',
          version: '0.0.1',
        },
        safeAddress: '0x123',
      })

      // render the hook
      const { result } = renderHook(() => useSafeNotifications())

      // check that the notification was shown
      expect(result.current).toBeUndefined()
      expect(showNotification).toHaveBeenCalledWith({
        variant: 'warning',
        message: `Safe version 0.0.1 is not supported by this web app anymore. You can update your Safe via the CLI.`,
        groupKey: 'safe-outdated-version',
        link: {
          href: 'https://github.com/5afe/safe-cli',
          title: 'Get CLI',
        },
      })
    })

    it('should not show a notification when the Safe version is up to date', () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: {
          implementation: { value: '0x123' },
          implementationVersionState: 'UP_TO_DATE',
          version: '1.3.0',
        },
      })

      // render the hook
      const { result } = renderHook(() => useSafeNotifications())

      // check that the notification was shown
      expect(result.current).toBeUndefined()
      expect(showNotification).not.toHaveBeenCalled()
    })
  })

  describe('Invalid mastercopy', () => {
    it('should show a notification when the mastercopy is invalid', () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: {
          implementation: { value: '0x123' },
          implementationVersionState: 'UNKNOWN',
          version: '1.3.0',
        },
      })

      // render the hook
      const { result } = renderHook(() => useSafeNotifications())

      // check that the notification was shown
      expect(result.current).toBeUndefined()
      expect(showNotification).toHaveBeenCalledWith({
        variant: 'warning',
        message: `This Safe was created with an unsupported base contract.
           The web interface might not work correctly.
           We recommend using the command line interface instead.`,
        groupKey: 'invalid-mastercopy',
        link: {
          href: 'https://github.com/5afe/safe-cli',
          title: 'Get CLI',
        },
      })
    })
    it('should not show a notification when the mastercopy is valid', async () => {
      ;(useSafeInfo as jest.Mock).mockReturnValue({
        safe: {
          implementation: { value: '0x456' },
          implementationVersionState: 'UP_TO_DATE',
          version: '1.3.0',
        },
      })

      // render the hook
      const { result } = renderHook(() => useSafeNotifications())

      // check that the notification was shown
      expect(result.current).toBeUndefined()
      expect(showNotification).not.toHaveBeenCalled()
    })
  })

  describe('isMigrationToL2Possible', () => {
    it('should not be possible to migrate Safes on chains without migration lib', () => {
      expect(isMigrationToL2Possible(safeInfoBuilder().with({ nonce: 0, chainId: '69420' }).build())).toBeFalsy()
    })

    it('should not be possible to migrate Safes with nonce > 0', () => {
      expect(isMigrationToL2Possible(safeInfoBuilder().with({ nonce: 2, chainId: '10' }).build())).toBeFalsy()
    })

    it('should be possible to migrate Safes with nonce 0 on chains with migration lib', () => {
      expect(isMigrationToL2Possible(safeInfoBuilder().with({ nonce: 0, chainId: '10' }).build())).toBeTruthy()
    })
  })
})
