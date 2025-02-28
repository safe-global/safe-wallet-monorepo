import { act, renderHook } from '@testing-library/react'
import * as gateway from '@safe-global/safe-gateway-typescript-sdk'

import * as useChainIdHook from '@/hooks/useChainId'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import type { SafeAppsTag } from '@/config/constants'

jest.mock('@safe-global/safe-gateway-typescript-sdk')

describe('useRemoteSafeApps', () => {
  beforeEach(() => {
    jest.useFakeTimers()

    jest.spyOn(useChainIdHook, 'default').mockReturnValue('5')
    jest
      .spyOn(gateway, 'getSafeApps')
      .mockResolvedValue([
        { name: 'B', tags: ['test'] } as gateway.SafeAppData,
        { name: 'A', tags: [] as gateway.SafeAppData['tags'] } as gateway.SafeAppData,
        { name: 'C', tags: ['test'] } as gateway.SafeAppData,
      ])
  })

  it('should alphabetically return the remote safe apps', async () => {
    const { result } = renderHook(() => useRemoteSafeApps())

    var [data, error, loading] = result.current

    // Check that the loading state is true
    expect(loading).toBe(true)
    expect(error).toBe(undefined)
    expect(data).toEqual(undefined)

    // Check that the loading state is false after the promise resolves
    await act(async () => {
      jest.advanceTimersByTime(100)
    })

    var [data, error, loading] = result.current

    expect(loading).toBe(false)
    expect(error).toBe(undefined)
    expect(data).toStrictEqual([
      { name: 'A', tags: [] },
      { name: 'B', tags: ['test'] },
      { name: 'C', tags: ['test'] },
    ])
  })
  it('should alphabetically return the remote safe apps filtered by tag', async () => {
    const { result } = renderHook(() => useRemoteSafeApps({ tag: 'test' as SafeAppsTag }))

    var [data, error, loading] = result.current

    // Check that the loading state is true
    expect(loading).toBe(true)
    expect(error).toBe(undefined)
    expect(data).toEqual(undefined)

    // Check that the loading state is false after the promise resolves
    await act(async () => {
      jest.advanceTimersByTime(100)
    })

    var [data, error, loading] = result.current

    expect(loading).toBe(false)
    expect(error).toBe(undefined)
    expect(data).toStrictEqual([
      { name: 'B', tags: ['test'] },
      { name: 'C', tags: ['test'] },
    ])
  })
})
