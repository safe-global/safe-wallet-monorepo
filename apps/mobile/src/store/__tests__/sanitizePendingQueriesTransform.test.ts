import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { CONFIG_SERVICE_KEY } from '@/src/config/constants'
import { sanitizePendingQueriesTransform } from '../index'

interface TransformResult {
  in: (state: Record<string, unknown>, key: string, config?: unknown) => Record<string, unknown>
  out: (state: Record<string, unknown>, key: string, config?: unknown) => Record<string, unknown>
}

const transform = sanitizePendingQueriesTransform as unknown as TransformResult

describe('sanitizePendingQueriesTransform', () => {
  describe('inbound (saving to storage)', () => {
    it('passes state through unchanged', () => {
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'pending', data: null },
        },
        config: { online: true },
      }

      const result = transform.in(state, cgwClient.reducerPath)

      expect(result).toEqual(state)
    })
  })

  describe('outbound (rehydrating from storage)', () => {
    it('removes queries with pending status', () => {
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'pending', startedTimeStamp: 123 },
        },
        config: { online: true },
      }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual({
        queries: {},
        config: { online: true },
      })
    })

    it('preserves data and rewrites a pending status to fulfilled', () => {
      // A refetch interrupted by an app kill must keep its last successful data; RTK Query's
      // rehydration matcher drops non-fulfilled/rejected entries, so the status is rewritten.
      const data = { ids: ['1'], entities: { '1': { chainId: '1' } } }
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'pending', data, fulfilledTimeStamp: 123 },
        },
        config: { online: true },
      }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual({
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'fulfilled', data, fulfilledTimeStamp: 123 },
        },
        config: { online: true },
      })
    })

    it('drops a pending query whose data is null', () => {
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'pending', data: null },
        },
      }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual({ queries: {} })
    })

    it('drops a pending query whose entity data is empty (an empty chain list is not usable data)', () => {
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'pending', data: { ids: [], entities: {} } },
        },
      }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual({ queries: {} })
    })

    it('preserves queries with fulfilled status', () => {
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'fulfilled', data: { chains: [] } },
        },
        config: { online: true },
      }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual(state)
    })

    it('preserves queries with rejected status', () => {
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'rejected', error: 'Network error' },
        },
      }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual(state)
    })

    it('filters only pending queries when mixed statuses exist', () => {
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: { status: 'pending' },
          'getBalances("0x123")': { status: 'fulfilled', data: [] },
          'getSafeInfo("0x456")': { status: 'rejected', error: 'Error' },
        },
      }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual({
        queries: {
          'getBalances("0x123")': { status: 'fulfilled', data: [] },
          'getSafeInfo("0x456")': { status: 'rejected', error: 'Error' },
        },
      })
    })

    it('returns state unchanged when queries is undefined', () => {
      const state = { config: { online: true } }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual(state)
    })

    it('returns state unchanged when state is undefined', () => {
      const result = transform.out(undefined as unknown as Record<string, unknown>, cgwClient.reducerPath)

      expect(result).toBeUndefined()
    })

    it('handles empty queries object', () => {
      const state = { queries: {} }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual({ queries: {} })
    })

    it('handles queries with undefined entries', () => {
      const state = {
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: undefined,
          'getBalances("0x123")': { status: 'fulfilled', data: [] },
        },
      }

      const result = transform.out(state, cgwClient.reducerPath)

      expect(result).toEqual({
        queries: {
          [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: undefined,
          'getBalances("0x123")': { status: 'fulfilled', data: [] },
        },
      })
    })
  })
})
