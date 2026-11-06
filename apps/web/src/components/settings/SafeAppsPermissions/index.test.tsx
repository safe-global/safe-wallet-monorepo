import { faker } from '@faker-js/faker'
import type { Permission } from '@safe-global/safe-apps-sdk/dist/types/types/permissions'
import { act, fireEvent, render, renderHook, screen, within } from '@/tests/test-utils'
import SafeAppsPermissions from '.'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import type { BrowserPermission, SafePermissions } from '@/hooks/safe-apps/permissions'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import local from '@/services/local-storage/local'
import { PermissionStatus } from '@safe-global/views/components/safe-apps/types'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

jest.mock('@/hooks/safe-apps/useSafeApps')

const BROWSER_PERMISSIONS_KEY = 'SafeApps__browserPermissions'
const SAFE_PERMISSIONS_KEY = 'SafeApps__safePermissions'

type BrowserPermissions = Record<string, BrowserPermission[]>

const anOrigin = (): string => `https://${faker.internet.domainName()}`

const multiFeatureApp = anOrigin()
const knownApp = anOrigin()
const deniedCameraApp = anOrigin()
const restrictedAddressBookApp = anOrigin()

const safeApp: SafeApp = {
  id: 1,
  url: knownApp,
  name: 'Known Safe App',
  description: 'Safe App description',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: [],
  features: [],
  socialProfiles: [],
  featured: false,
}

const addressBookPermission = (origin: string, restricted = false): Permission => ({
  invoker: origin,
  parentCapability: 'requestAddressBook',
  date: faker.date.past().getTime(),
  caveats: restricted ? [{ type: 'userRestricted', value: true }] : [],
})

const storedBrowserPermissions = (): BrowserPermissions => ({
  [multiFeatureApp]: [
    { feature: 'camera', status: PermissionStatus.GRANTED },
    { feature: 'fullscreen', status: PermissionStatus.GRANTED },
    { feature: 'geolocation', status: PermissionStatus.GRANTED },
  ],
  [knownApp]: [{ feature: 'microphone', status: PermissionStatus.GRANTED }],
  [deniedCameraApp]: [{ feature: 'camera', status: PermissionStatus.DENIED }],
})

const storedSafePermissions = (): SafePermissions => ({
  [knownApp]: [addressBookPermission(knownApp)],
  [restrictedAddressBookApp]: [addressBookPermission(restrictedAddressBookApp, true)],
})

// Writing through the hook also resets its in-memory cache, which outlives localStorage.clear().
const storeValue = <T,>(key: string, value: T): void => {
  const { result } = renderHook(() => useLocalStorage<T>(key))
  act(() => result.current[1](value))
}

const getAppRow = (origin: string): HTMLElement => {
  const row = screen.getByText(origin).closest<HTMLElement>('[data-testid="app-permissions-item"]')
  if (!row) throw new Error(`No permissions row for ${origin}`)
  return row
}

const getCheckbox = (origin: string, label: string): HTMLElement =>
  within(getAppRow(origin)).getByRole('checkbox', { name: label })

const clickRowLink = (origin: string, name: string): void => {
  fireEvent.click(within(getAppRow(origin)).getByRole('link', { name }))
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

    storeValue(BROWSER_PERMISSIONS_KEY, storedBrowserPermissions())
    storeValue(SAFE_PERMISSIONS_KEY, storedSafePermissions())
  })

  it('lists each app once, whether it has browser permissions, Safe permissions or both', () => {
    render(<SafeAppsPermissions />)

    expect(screen.getAllByTestId('app-permissions-item')).toHaveLength(4)
  })

  it('shows the name of a known app as a heading next to its origin', () => {
    render(<SafeAppsPermissions />)

    expect(screen.getByText('Safe Apps permissions')).toBeInTheDocument()
    expect(within(getAppRow(knownApp)).getByRole('heading', { level: 5, name: 'Known Safe App' })).toBeInTheDocument()
  })

  it('checks the granted browser features and leaves the denied ones unchecked', () => {
    render(<SafeAppsPermissions />)

    expect(getCheckbox(multiFeatureApp, 'Camera')).toBeChecked()
    expect(getCheckbox(multiFeatureApp, 'Fullscreen')).toBeChecked()
    expect(getCheckbox(multiFeatureApp, 'Geolocation')).toBeChecked()
    expect(getCheckbox(deniedCameraApp, 'Camera')).not.toBeChecked()
  })

  it('checks the address book permission unless the user restricted it', () => {
    render(<SafeAppsPermissions />)

    expect(getCheckbox(knownApp, 'Address Book')).toBeChecked()
    expect(getCheckbox(knownApp, 'Microphone')).toBeChecked()
    expect(getCheckbox(restrictedAddressBookApp, 'Address Book')).not.toBeChecked()
  })

  it('denies every permission of an app with Clear all and stores the denial', () => {
    render(<SafeAppsPermissions />)

    clickRowLink(knownApp, 'Clear all')

    expect(getCheckbox(knownApp, 'Address Book')).not.toBeChecked()
    expect(getCheckbox(knownApp, 'Microphone')).not.toBeChecked()
    expect(local.getItem<BrowserPermissions>(BROWSER_PERMISSIONS_KEY)?.[knownApp]).toEqual([
      { feature: 'microphone', status: PermissionStatus.DENIED },
    ])
    expect(local.getItem<SafePermissions>(SAFE_PERMISSIONS_KEY)?.[knownApp][0].caveats).toEqual([
      { type: 'userRestricted', value: true },
    ])
  })

  it('grants every permission of an app with Allow all, including a restricted one', () => {
    render(<SafeAppsPermissions />)

    clickRowLink(knownApp, 'Clear all')
    clickRowLink(knownApp, 'Allow all')
    clickRowLink(restrictedAddressBookApp, 'Allow all')

    expect(getCheckbox(knownApp, 'Address Book')).toBeChecked()
    expect(getCheckbox(knownApp, 'Microphone')).toBeChecked()
    expect(getCheckbox(restrictedAddressBookApp, 'Address Book')).toBeChecked()
  })

  it('removes an app from both permission stores and keeps the other apps', () => {
    render(<SafeAppsPermissions />)

    clickRowLink(knownApp, 'Remove permissions')

    expect(screen.queryByText(knownApp)).not.toBeInTheDocument()
    expect(Object.keys(local.getItem<BrowserPermissions>(BROWSER_PERMISSIONS_KEY) ?? {})).toEqual([
      multiFeatureApp,
      deniedCameraApp,
    ])
    expect(Object.keys(local.getItem<SafePermissions>(SAFE_PERMISSIONS_KEY) ?? {})).toEqual([restrictedAddressBookApp])
  })

  it('says so when no app uses permissions', () => {
    storeValue(BROWSER_PERMISSIONS_KEY, {})
    storeValue(SAFE_PERMISSIONS_KEY, {})

    render(<SafeAppsPermissions />)

    expect(screen.getByText('There are no Safe Apps using permissions.')).toBeInTheDocument()
  })
})
