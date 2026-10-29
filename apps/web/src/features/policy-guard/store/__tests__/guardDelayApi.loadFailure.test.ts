import type { JsonRpcProvider } from 'ethers'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { logError } from '@/services/exceptions'
import { makeStore } from '@/store'
import { chainBuilder } from '@/tests/builders/chains'
import { guardDelayApi } from '../guardDelayApi'

const mockLoadError = new Error('chunk failed')

jest.mock('../../services/readGuardDelay', () => {
  throw mockLoadError
})
jest.mock('../../services/getReadOnlyProvider', () => ({
  getReadOnlyProvider: jest.fn().mockResolvedValue({ call: jest.fn() } as unknown as JsonRpcProvider),
}))
jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

describe('guardDelayApi.getGuardDelay', () => {
  it('should log the failure and return it as the error, when the reader cannot be loaded', async () => {
    const store = makeStore()
    await store.dispatch(
      apiSliceWithChainsConfig.util.upsertQueryData(
        'getChainsConfigV2',
        CONFIG_SERVICE_KEY,
        chainsAdapter.setAll(chainsInitialState, [chainBuilder().with({ chainId: '11155111' }).build()]),
      ),
    )
    const result = store.dispatch(
      guardDelayApi.endpoints.getGuardDelay.initiate({
        chainId: '11155111',
        guardAddress: '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f',
      }),
    )

    await expect(result.unwrap()).rejects.toBe(mockLoadError)
    expect(logError).toHaveBeenCalledWith(ErrorCodes._658, mockLoadError)
  })
})
