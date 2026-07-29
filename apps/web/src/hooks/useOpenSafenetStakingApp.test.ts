import { act } from '@testing-library/react'
import { renderHook } from '@/tests/test-utils'
import { useOpenSafenetStakingApp } from './useOpenSafenetStakingApp'
import { AppRoutes } from '@/config/routes'
import { SafeAppsTag } from '@/config/constants'

const mockPush = jest.fn()
const SAFE = 'eth:0x0000000000000000000000000000000000000001'
const SAFENET_APP_URL = 'https://safenet.staking.example/app'

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => '1',
}))

const mockLogError = jest.fn()
jest.mock('@/services/exceptions', () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}))

const mockTriggerSafeApps = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safe-apps', () => ({
  useLazySafeAppsGetSafeAppsV1Query: () => [mockTriggerSafeApps],
}))

type SafeApp = { url: string; tags: string[] }

const mockSafeAppsResolve = (apps: SafeApp[]) =>
  mockTriggerSafeApps.mockReturnValue({ unwrap: () => Promise.resolve(apps) })

const mockSafeAppsReject = (error: Error) =>
  mockTriggerSafeApps.mockReturnValue({ unwrap: () => Promise.reject(error) })

describe('useOpenSafenetStakingApp', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({ push: mockPush })
    jest.spyOn(require('next/navigation'), 'useSearchParams').mockReturnValue(new URLSearchParams({ safe: SAFE }))
  })

  it('opens the Safenet-tagged app in the app frame', async () => {
    mockSafeAppsResolve([
      { url: 'https://other.example', tags: ['other'] },
      { url: SAFENET_APP_URL, tags: [SafeAppsTag.SAFENET] },
    ])

    const { result } = renderHook(() => useOpenSafenetStakingApp())

    await act(async () => {
      await result.current.openSafenetStakingApp()
    })

    expect(mockPush).toHaveBeenCalledWith(
      `${AppRoutes.apps.open}?safe=${SAFE}&appUrl=${encodeURIComponent(SAFENET_APP_URL)}`,
    )
  })

  it('does not navigate when no Safenet app is available', async () => {
    mockSafeAppsResolve([{ url: 'https://other.example', tags: ['other'] }])

    const { result } = renderHook(() => useOpenSafenetStakingApp())

    await act(async () => {
      await result.current.openSafenetStakingApp()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('logs the error and does not navigate when the CGW call fails', async () => {
    const error = new Error('network error')
    mockSafeAppsReject(error)

    const { result } = renderHook(() => useOpenSafenetStakingApp())

    await act(async () => {
      await result.current.openSafenetStakingApp()
    })

    expect(mockLogError).toHaveBeenCalledWith(expect.anything(), error)
    expect(mockPush).not.toHaveBeenCalled()
    // The button recovers so it can be retried
    expect(result.current.isNavigating).toBe(false)
  })

  it('ignores concurrent calls while a navigation is already in flight', async () => {
    mockSafeAppsResolve([{ url: SAFENET_APP_URL, tags: [SafeAppsTag.SAFENET] }])

    const { result } = renderHook(() => useOpenSafenetStakingApp())

    await act(async () => {
      await Promise.all([result.current.openSafenetStakingApp(), result.current.openSafenetStakingApp()])
    })

    expect(mockTriggerSafeApps).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledTimes(1)
  })

  it('resets the navigating flag after completion', async () => {
    mockSafeAppsResolve([{ url: SAFENET_APP_URL, tags: [SafeAppsTag.SAFENET] }])

    const { result } = renderHook(() => useOpenSafenetStakingApp())

    expect(result.current.isNavigating).toBe(false)

    await act(async () => {
      await result.current.openSafenetStakingApp()
    })

    expect(result.current.isNavigating).toBe(false)
  })
})
