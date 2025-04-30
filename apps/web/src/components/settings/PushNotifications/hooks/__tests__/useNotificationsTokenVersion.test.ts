import { toBeHex } from 'ethers'
import { NOTIFICATIONS_TOKEN_VERSION_KEY, useNotificationsTokenVersion } from '../useNotificationsTokenVersion'
import * as useChains from '@/hooks/useChains'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as localStorage from '@/services/local-storage/useLocalStorage'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import { renderHook } from '@testing-library/react'

import { FEATURES } from '@safe-global/utils/utils/chains'

const { V1, V2 } = NotificationsTokenVersion

describe('useNotificationsTokenVersion', () => {
  const chainId1 = '123'
  const chainId2 = '234'

  const safeAddress1 = toBeHex('0x1', 20)
  const safeAddress2 = toBeHex('0x2', 20)

  const localStorageMock = { [chainId1]: { [safeAddress1]: V1 }, [chainId2]: { [safeAddress2]: V2 } }
  const setLocalStorageMock = jest.fn()

  const useHasFeatureSpy = jest.spyOn(useChains, 'useHasFeature')
  const localStorageSpy = jest.spyOn(localStorage, 'default')
  const useSafeInfoSpy = jest.spyOn(useSafeInfoHook, 'default')

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    useHasFeatureSpy.mockReturnValue(true)
    localStorageSpy.mockReturnValue([localStorageMock, setLocalStorageMock])

    useSafeInfoSpy.mockReturnValue({
      safe: {
        chainId: chainId1,
        address: { value: safeAddress1 },
      },
      safeLoaded: true,
    } as unknown as ReturnType<typeof useSafeInfoHook.default>)
  })

  it("should return the current loaded Safe's token version", () => {
    const { result } = renderHook(() => useNotificationsTokenVersion())

    expect(result.current.safeTokenVersion).toBe(V1)
    expect(result.current.allTokenVersions).toBe(localStorageMock)
    expect(result.current.setTokenVersion).toBeInstanceOf(Function)

    expect(useHasFeatureSpy).toHaveBeenCalledTimes(1)
    expect(useHasFeatureSpy).toHaveBeenCalledWith(FEATURES.RENEW_NOTIFICATIONS_TOKEN)

    expect(localStorageSpy).toHaveBeenCalledTimes(1)
    expect(localStorageSpy).toHaveBeenCalledWith(NOTIFICATIONS_TOKEN_VERSION_KEY)

    expect(useSafeInfoSpy).toHaveBeenCalledTimes(1)
    expect(useSafeInfoSpy).toHaveBeenCalledWith()
  })

  it('should return undefined `safeTokenVersion` if no Safe is loaded', () => {
    useSafeInfoSpy.mockReturnValue({
      safe: {
        chainId: undefined,
        address: { value: undefined },
      },
      safeLoaded: false,
    } as unknown as ReturnType<typeof useSafeInfoHook.default>)

    const { result } = renderHook(() => useNotificationsTokenVersion())

    expect(result.current.safeTokenVersion).toBe(undefined)
    expect(result.current.allTokenVersions).toBe(localStorageMock)
    expect(result.current.setTokenVersion).toBeInstanceOf(Function)
  })

  it('should return undefined `allTokenVersions` if no token versions are stored', () => {
    localStorageSpy.mockReturnValue([undefined, setLocalStorageMock])

    const { result } = renderHook(() => useNotificationsTokenVersion())

    expect(result.current.safeTokenVersion).toBe(undefined)
    expect(result.current.allTokenVersions).toBe(undefined)
    expect(result.current.setTokenVersion).toBeInstanceOf(Function)
  })

  it('should return undefined for `safeTokenVersion` if notifications renewal is not enabled', () => {
    useHasFeatureSpy.mockReturnValue(false)

    const { result } = renderHook(() => useNotificationsTokenVersion())

    expect(result.current.safeTokenVersion).toBe(undefined)
    expect(result.current.allTokenVersions).toBe(undefined)
    expect(result.current.setTokenVersion).toBeInstanceOf(Function)
  })

  describe('setTokenVersion', () => {
    beforeEach(() => {})

    it('should update the token version for the current loaded Safe', () => {
      const { result } = renderHook(() => useNotificationsTokenVersion())

      result.current.setTokenVersion(V2)

      expect(setLocalStorageMock).toHaveBeenCalledTimes(1)
      expect(setLocalStorageMock).toHaveBeenCalledWith({ ...localStorageMock, [chainId1]: { [safeAddress1]: V2 } })
    })

    it('should update the token version for the provided Safes', () => {
      const chainId3 = '987'
      const safesToUpdate = { [chainId2]: [safeAddress2], [chainId3]: [safeAddress1] }

      const { result } = renderHook(() => useNotificationsTokenVersion())

      result.current.setTokenVersion(V2, safesToUpdate)

      expect(setLocalStorageMock).toHaveBeenCalledTimes(1)
      expect(setLocalStorageMock).toHaveBeenCalledWith({
        ...localStorageMock,
        [chainId2]: { [safeAddress2]: V2 },
        [chainId3]: { [safeAddress1]: V2 },
      })
    })

    it('should not update the token version if notifications renewal is not enabled', () => {
      useHasFeatureSpy.mockReturnValue(false)

      const { result } = renderHook(() => useNotificationsTokenVersion())

      result.current.setTokenVersion(V2)

      expect(setLocalStorageMock).not.toHaveBeenCalled()
    })

    it('should not update the token version if no Safes are provided and no Safe is loaded', () => {
      useSafeInfoSpy.mockReturnValue({
        safe: {
          chainId: undefined,
          address: { value: undefined },
        },
        safeLoaded: false,
      } as unknown as ReturnType<typeof useSafeInfoHook.default>)

      const { result } = renderHook(() => useNotificationsTokenVersion())

      result.current.setTokenVersion(V2)

      expect(setLocalStorageMock).not.toHaveBeenCalled()
    })
  })
})
