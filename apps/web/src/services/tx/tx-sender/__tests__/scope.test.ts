import type Safe from '@safe-global/protocol-kit'
import type { JsonRpcProvider } from 'ethers'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { registerActiveScope } from '@/components/tx-flow/safe-scope/activeScope'
import type { TxSenderScope } from '@/components/tx-flow/safe-scope/types'
import { getAndValidateSafeSDK, getSafeProvider, getSafeSDKWithSigner } from '../sdk'
import { createMultiSendCallOnlyTx, createTx } from '../create'
import { getReadOnlyCurrentGnosisSafeContract } from '@/services/contracts/safeContracts'
import { safeInfoBuilder } from '@/tests/builders/safe'

// `jest.spyOn(exceptions, 'logError')` throws "Cannot redefine property" under the
// Next.js/SWC jest transform for this module (reproduced standalone), so this file
// follows the repo's established `jest.mock` convention for `@/services/exceptions`
// (see e.g. hypernativeGuardCheck.test.ts) instead of spying on the real module.
jest.mock('@/services/exceptions', () => ({
  logError: jest.fn(),
}))

// `getReadOnlyCurrentGnosisSafeContract` builds a real ethers contract from the SDK's
// SafeProvider; only its choice of *which* SDK to read matters here, so the actual
// contract construction is stubbed out.
jest.mock('@safe-global/protocol-kit', () => ({
  ...jest.requireActual('@safe-global/protocol-kit'),
  getSafeContract: jest.fn().mockResolvedValue({}),
}))

const mockLogError = logError as jest.MockedFunction<typeof logError>

const singletonSdk = { createTransaction: jest.fn(), connect: jest.fn() } as unknown as Safe
const scopedSdk = { createTransaction: jest.fn(), connect: jest.fn() } as unknown as Safe
const scopedProvider = { _getConnection: () => ({ url: 'https://rpc.scoped' }) } as unknown as JsonRpcProvider

const scope: TxSenderScope = {
  chainId: '137',
  safeAddress: '0x0000000000000000000000000000000000000456',
  sdk: scopedSdk,
  web3ReadOnly: scopedProvider,
}

describe('tx-sender scope handling', () => {
  beforeEach(() => {
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(singletonSdk)
    mockLogError.mockClear()
  })
  afterEach(() => jest.restoreAllMocks())

  describe('getAndValidateSafeSDK', () => {
    it('returns the singleton without a scope and does not log (regression baseline)', () => {
      expect(getAndValidateSafeSDK()).toBe(singletonSdk)
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('returns the scoped SDK when a scope is passed', () => {
      expect(getAndValidateSafeSDK(scope)).toBe(scopedSdk)
    })

    it('throws instead of falling back when the scope has no SDK yet', () => {
      expect(() => getAndValidateSafeSDK({ ...scope, sdk: undefined })).toThrow(
        'The Safe SDK for the selected Safe account is not initialized yet.',
      )
    })

    it('throws and logs once when the singleton is reached while a SafeScope is mounted', () => {
      const unregister = registerActiveScope()
      try {
        expect(() => getAndValidateSafeSDK()).toThrow(
          'A Safe account must be selected before transacting in this flow.',
        )
        expect(mockLogError).toHaveBeenCalledTimes(1)
        expect(mockLogError).toHaveBeenCalledWith(ErrorCodes._822, expect.any(String))
      } finally {
        unregister()
      }
    })
  })

  it('getSafeProvider uses the scoped provider URL', () => {
    jest.spyOn(web3ReadOnly, 'getWeb3ReadOnly').mockReturnValue(undefined)
    expect(() => getSafeProvider()).toThrow('Provider not found.')
    expect(getSafeProvider(scope)).toBeDefined()
  })

  it('getSafeProvider throws instead of falling back when the scope has no provider yet', () => {
    expect(() => getSafeProvider({ ...scope, web3ReadOnly: undefined })).toThrow(
      'The provider for the selected Safe account is not initialized yet.',
    )
  })

  it('getSafeSDKWithSigner connects the scoped SDK', async () => {
    const eip1193 = { request: jest.fn() }
    await getSafeSDKWithSigner(eip1193, scope)
    expect(scopedSdk.connect).toHaveBeenCalledWith({ provider: eip1193 })
    expect(singletonSdk.connect).not.toHaveBeenCalled()
  })

  it('createTx / createMultiSendCallOnlyTx build on the scoped SDK', async () => {
    const txParams = { to: scope.safeAddress, value: '0', data: '0x' }
    await createTx(txParams, 3, scope)
    expect(scopedSdk.createTransaction).toHaveBeenCalledWith({ transactions: [{ ...txParams, nonce: 3 }] })
    await createMultiSendCallOnlyTx([txParams], scope)
    expect(scopedSdk.createTransaction).toHaveBeenCalledWith({ transactions: [txParams], onlyCalls: true })
    expect(singletonSdk.createTransaction).not.toHaveBeenCalled()
  })

  it('getReadOnlyCurrentGnosisSafeContract (relay path) uses the scoped SDK and never touches the singleton', async () => {
    const scopedGetSafeProvider = jest.fn().mockReturnValue({})
    const scopedSdkWithProvider = { ...scopedSdk, getSafeProvider: scopedGetSafeProvider } as unknown as Safe
    const safe = safeInfoBuilder().with({ version: '1.4.1' }).build()

    await getReadOnlyCurrentGnosisSafeContract(safe, { ...scope, sdk: scopedSdkWithProvider })

    expect(scopedGetSafeProvider).toHaveBeenCalledTimes(1)
    expect(safeCoreSDK.getSafeSDK).not.toHaveBeenCalled()
  })
})
