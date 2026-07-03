import { render, screen } from '@/tests/test-utils'
import SafeAppsPermissions from '.'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import { useBrowserPermissions, useSafePermissions } from '@/hooks/safe-apps/permissions'
import type * as SafeAppsPermissionHooks from '@/hooks/safe-apps/permissions'
import { PermissionStatus } from '@/components/safe-apps/types'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

jest.mock('@/hooks/safe-apps/useSafeApps')

jest.mock('@/hooks/safe-apps/permissions', () => {
  const actual = jest.requireActual<typeof SafeAppsPermissionHooks>('@/hooks/safe-apps/permissions')

  return {
    __esModule: true,
    ...actual,
    useBrowserPermissions: jest.fn(),
    useSafePermissions: jest.fn(),
  }
})

const safeAppUrl = 'https://app.safe.global'

const safeApp: SafeApp = {
  id: 1,
  url: safeAppUrl,
  name: 'Safe App',
  description: 'Safe App description',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: [],
  features: [],
  socialProfiles: [],
  featured: false,
}

describe('SafeAppsPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSafeApps as jest.MockedFunction<typeof useSafeApps>).mockReturnValue({
      allSafeApps: [safeApp],
      pinnedSafeApps: [],
      pinnedSafeAppIds: new Set(),
      remoteSafeApps: [safeApp],
      customSafeApps: [],
      rankedSafeApps: [safeApp],
      remoteSafeAppsLoading: false,
      customSafeAppsLoading: false,
      addCustomApp: jest.fn(),
      togglePin: jest.fn(),
      removeCustomApp: jest.fn(),
      getSafeAppByUrl: jest.fn(),
      currentSafeApp: undefined,
    } as ReturnType<typeof useSafeApps>)
    ;(useSafePermissions as jest.MockedFunction<typeof useSafePermissions>).mockReturnValue({
      permissions: {},
      getPermissions: jest.fn(),
      updatePermission: jest.fn(),
      removePermissions: jest.fn(),
      permissionsRequest: undefined,
      setPermissionsRequest: jest.fn(),
      confirmPermissionRequest: jest.fn(),
      hasPermission: jest.fn(),
      isUserRestricted: jest.fn(() => false),
    } as ReturnType<typeof useSafePermissions>)
    ;(useBrowserPermissions as jest.MockedFunction<typeof useBrowserPermissions>).mockReturnValue({
      permissions: {
        [safeAppUrl]: [{ feature: 'camera', status: PermissionStatus.GRANTED }],
      },
      getPermissions: jest.fn(),
      updatePermission: jest.fn(),
      addPermissions: jest.fn(),
      removePermissions: jest.fn(),
      getAllowedFeaturesList: jest.fn(),
    } as ReturnType<typeof useBrowserPermissions>)
  })

  it('renders Safe Apps permissions in a shared card shell', () => {
    render(<SafeAppsPermissions />)

    expect(screen.getByText('Safe Apps permissions').closest('[data-slot="card"]')).toHaveClass('p-8')
    expect(screen.getByText('Safe App')).toBeInTheDocument()
    expect(screen.getByText(safeAppUrl)).toBeInTheDocument()
  })
})
