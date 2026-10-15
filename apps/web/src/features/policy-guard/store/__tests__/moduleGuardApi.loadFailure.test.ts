import type { JsonRpcProvider } from 'ethers'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { logError } from '@/services/exceptions'
import { makeStore } from '@/store'
import { chainBuilder } from '@/tests/builders/chains'
import { moduleGuardApi } from '../moduleGuardApi'

const mockLoadError = new Error('chunk failed')

jest.mock('../../services/readModuleGuard', () => {
  throw mockLoadError
})
jest.mock('../../services/getReadOnlyProvider', () => ({
  getReadOnlyProvider: jest.fn().mockResolvedValue({ getStorage: jest.fn() } as unknown as JsonRpcProvider),
}))
jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

describe('moduleGuardApi.getModuleGuard when the reader cannot be loaded', () => {
  it('logs the load failure and returns it as the error', async () => {
    const store = makeStore()
    await store.dispatch(
      apiSliceWithChainsConfig.util.upsertQueryData(
        'getChainsConfigV2',
        CONFIG_SERVICE_KEY,
        chainsAdapter.setAll(chainsInitialState, [chainBuilder().with({ chainId: '11155111' }).build()]),
      ),
    )
    const result = store.dispatch(
      moduleGuardApi.endpoints.getModuleGuard.initiate({
        chainId: '11155111',
        safeAddress: '0x3333333333333333333333333333333333333333',
        txHistoryTag: '1',
      }),
    )
    await expect(result.unwrap()).rejects.toBe(mockLoadError)
    expect(logError).toHaveBeenCalledWith(ErrorCodes._654, mockLoadError)
  })
})
