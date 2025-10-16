import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { mockSafeAppsForSorting } from '@safe-global/test/msw/mockSafeApps'

import * as useChainIdHook from '@/hooks/useChainId'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import type { SafeAppsTag } from '@/config/constants'
import { renderHook } from '@/tests/test-utils'

describe('useRemoteSafeApps', () => {
  beforeEach(() => {
    jest.spyOn(useChainIdHook, 'default').mockReturnValue('5')

    // Override the default safe-apps handler for this specific test suite
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safe-apps`, () => {
        return HttpResponse.json(mockSafeAppsForSorting)
      }),
    )
  })

  it('should alphabetically return the remote safe apps', async () => {
    const { result } = renderHook(() => useRemoteSafeApps())

    // Initial state should be loading
    expect(result.current[2]).toBe(true) // loading
    expect(result.current[0]).toEqual(undefined) // data

    // Wait for the data to be loaded
    await waitFor(() => {
      expect(result.current[2]).toBe(false) // loading
    })

    const [data, , loading] = result.current

    expect(loading).toBe(false)
    expect(data).toStrictEqual([
      {
        id: 2,
        name: 'A',
        url: 'https://app-a.com',
        iconUrl: '',
        description: '',
        chainIds: ['5'],
        accessControl: { type: 'NO_RESTRICTIONS' },
        tags: [],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: false,
      },
      {
        id: 1,
        name: 'B',
        url: 'https://app-b.com',
        iconUrl: '',
        description: '',
        chainIds: ['5'],
        accessControl: { type: 'NO_RESTRICTIONS' },
        tags: ['test'],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: false,
      },
      {
        id: 3,
        name: 'C',
        url: 'https://app-c.com',
        iconUrl: '',
        description: '',
        chainIds: ['5'],
        accessControl: { type: 'NO_RESTRICTIONS' },
        tags: ['test'],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: false,
      },
    ])
  })
  it('should alphabetically return the remote safe apps filtered by tag', async () => {
    const { result } = renderHook(() => useRemoteSafeApps({ tag: 'test' as SafeAppsTag }))

    // Initial state should be loading
    expect(result.current[2]).toBe(true) // loading
    expect(result.current[0]).toEqual(undefined) // data

    // Wait for the data to be loaded
    await waitFor(() => {
      expect(result.current[2]).toBe(false) // loading
    })

    const [data, , loading] = result.current

    expect(loading).toBe(false)
    expect(data).toStrictEqual([
      {
        id: 1,
        name: 'B',
        url: 'https://app-b.com',
        iconUrl: '',
        description: '',
        chainIds: ['5'],
        accessControl: { type: 'NO_RESTRICTIONS' },
        tags: ['test'],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: false,
      },
      {
        id: 3,
        name: 'C',
        url: 'https://app-c.com',
        iconUrl: '',
        description: '',
        chainIds: ['5'],
        accessControl: { type: 'NO_RESTRICTIONS' },
        tags: ['test'],
        features: [],
        socialProfiles: [],
        developerWebsite: '',
        featured: false,
      },
    ])
  })
})
