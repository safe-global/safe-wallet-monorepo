import * as React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useImportSafe } from './useImportSafe'
import { createTestStore, type TestStore } from '@/src/tests/test-utils'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema } from '@/src/features/ImportReadOnly/schema'
import type { FormValues } from '@/src/features/ImportReadOnly/types'
import { Provider } from 'react-redux'
import { http, HttpResponse } from 'msw'
import { server } from '@/src/tests/server'
import { GATEWAY_URL } from '@/src/config/constants'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

jest.mock('lodash/debounce', () => (fn: (...args: unknown[]) => unknown) => {
  const debounced = fn as ((...args: unknown[]) => unknown) & { cancel: () => void }
  debounced.cancel = jest.fn()
  return debounced
})

const VALID_ADDRESS = '0x1234567890123456789012345678901234567890'

const createMockSafeOverview = (chainId: string, address: string): SafeOverview => ({
  address: { value: address, name: null, logoUri: null },
  chainId,
  threshold: 2,
  owners: [{ value: '0xowner1' }, { value: '0xowner2' }],
  fiatTotal: '1000',
  queued: 0,
  awaitingConfirmation: null,
})

const createStoreWithChains = async (): Promise<TestStore> => {
  const store = createTestStore({
    settings: { currency: 'usd' },
  })
  await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
  return store
}

const createWrapper = (store: TestStore, defaultValues?: Partial<FormValues>) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    const methods = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      mode: 'onChange',
      defaultValues: { name: '', safeAddress: '', ...defaultValues },
    })
    return (
      <Provider store={store}>
        <FormProvider {...methods}>{children}</FormProvider>
      </Provider>
    )
  }

describe('useImportSafe', () => {
  describe('address input handling', () => {
    it('should trigger query for valid address', async () => {
      const mockSafeOverviews = [
        createMockSafeOverview('1', VALID_ADDRESS),
        createMockSafeOverview('137', VALID_ADDRESS),
      ]

      server.use(
        http.get(`${GATEWAY_URL}/v2/safes`, () => {
          return HttpResponse.json(mockSafeOverviews)
        }),
      )

      const store = await createStoreWithChains()
      renderHook(() => useImportSafe(), { wrapper: createWrapper(store, { safeAddress: VALID_ADDRESS }) })

      await act(async () => {
        jest.runAllTimers()
      })

      await waitFor(() => {
        const state = store.getState()
        const queries = state.api.queries
        const safeQuery = Object.keys(queries).find((key) => key.startsWith('safesGetOverviewForMany'))
        expect(safeQuery).toBeDefined()
      })
    })

    it('should not trigger query for invalid address', async () => {
      const store = await createStoreWithChains()
      renderHook(() => useImportSafe(), { wrapper: createWrapper(store, { safeAddress: 'invalid-address' }) })

      await act(async () => {
        jest.runAllTimers()
      })

      const state = store.getState()
      const queries = state.api.queries
      const safeQuery = Object.keys(queries).find((key) => key.startsWith('safesGetOverviewForMany'))
      expect(safeQuery).toBeUndefined()
    })

    it('should not trigger query for short address', async () => {
      const store = await createStoreWithChains()
      renderHook(() => useImportSafe(), { wrapper: createWrapper(store, { safeAddress: '0x123' }) })

      await act(async () => {
        jest.runAllTimers()
      })

      const state = store.getState()
      const queries = state.api.queries
      const safeQuery = Object.keys(queries).find((key) => key.startsWith('safesGetOverviewForMany'))
      expect(safeQuery).toBeUndefined()
    })
  })

  describe('query result handling', () => {
    it('should handle successful query with Safe deployments', async () => {
      const mockSafeOverviews = [createMockSafeOverview('1', VALID_ADDRESS)]

      server.use(
        http.get(`${GATEWAY_URL}/v2/safes`, () => {
          return HttpResponse.json(mockSafeOverviews)
        }),
      )

      const store = await createStoreWithChains()
      renderHook(() => useImportSafe(), { wrapper: createWrapper(store, { safeAddress: VALID_ADDRESS }) })

      await act(async () => {
        jest.runAllTimers()
      })

      await waitFor(() => {
        const state = store.getState()
        const queries = state.api.queries
        const safeQueryKey = Object.keys(queries).find((key) => key.startsWith('safesGetOverviewForMany'))
        if (safeQueryKey) {
          const query = queries[safeQueryKey]
          expect(query?.status).toBe('fulfilled')
          expect(query?.data).toEqual(mockSafeOverviews)
        }
      })
    })

    it('should handle empty response when no Safe deployment found', async () => {
      server.use(
        http.get(`${GATEWAY_URL}/v2/safes`, () => {
          return HttpResponse.json([])
        }),
      )

      const store = await createStoreWithChains()
      renderHook(() => useImportSafe(), { wrapper: createWrapper(store, { safeAddress: VALID_ADDRESS }) })

      await act(async () => {
        jest.runAllTimers()
      })

      await waitFor(() => {
        const state = store.getState()
        const queries = state.api.queries
        const safeQueryKey = Object.keys(queries).find((key) => key.startsWith('safesGetOverviewForMany'))
        if (safeQueryKey) {
          const query = queries[safeQueryKey]
          expect(query?.status).toBe('fulfilled')
          expect(query?.data).toEqual([])
        }
      })
    })

    it('should handle API error', async () => {
      server.use(
        http.get(`${GATEWAY_URL}/v2/safes`, () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
        }),
      )

      const store = await createStoreWithChains()
      renderHook(() => useImportSafe(), { wrapper: createWrapper(store, { safeAddress: VALID_ADDRESS }) })

      await act(async () => {
        jest.runAllTimers()
      })

      await waitFor(() => {
        const state = store.getState()
        const queries = state.api.queries
        const safeQueryKey = Object.keys(queries).find((key) => key.startsWith('safesGetOverviewForMany'))
        if (safeQueryKey) {
          const query = queries[safeQueryKey]
          expect(query?.status).toBe('rejected')
        }
      })
    })
  })

  describe('multi-chain queries', () => {
    it('should query all available chains', async () => {
      let requestedSafes: string[] = []

      server.use(
        http.get(`${GATEWAY_URL}/v2/safes`, ({ request }) => {
          const url = new URL(request.url)
          const safes = url.searchParams.get('safes')
          if (safes) {
            requestedSafes = safes.split(',')
          }
          return HttpResponse.json([createMockSafeOverview('1', VALID_ADDRESS)])
        }),
      )

      const store = await createStoreWithChains()
      renderHook(() => useImportSafe(), { wrapper: createWrapper(store, { safeAddress: VALID_ADDRESS }) })

      await act(async () => {
        jest.runAllTimers()
      })

      await waitFor(() => {
        expect(requestedSafes.length).toBeGreaterThan(0)
        expect(requestedSafes.some((s) => s.includes('1:'))).toBe(true)
        expect(requestedSafes.some((s) => s.includes('137:'))).toBe(true)
      })
    })

    it('should use configured currency from store', async () => {
      let requestedCurrency: string | null = null

      server.use(
        http.get(`${GATEWAY_URL}/v2/safes`, ({ request }) => {
          const url = new URL(request.url)
          requestedCurrency = url.searchParams.get('currency')
          return HttpResponse.json([])
        }),
      )

      const store = await createStoreWithChains()
      renderHook(() => useImportSafe(), { wrapper: createWrapper(store, { safeAddress: VALID_ADDRESS }) })

      await act(async () => {
        jest.runAllTimers()
      })

      await waitFor(() => {
        expect(requestedCurrency).toBe('usd')
      })
    })
  })
})
