import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as txSender from '@/services/tx/tx-sender/create'
import { chainBuilder } from '@/tests/builders/chains'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { NewSpendingLimitData } from '../types'
import { createNewSpendingLimitTx, NO_ALLOWANCE_MODULE_ERROR } from './spendingLimitExecution'

const mockData: NewSpendingLimitData = {
  beneficiary: ZERO_ADDRESS,
  tokenAddress: ZERO_ADDRESS,
  amount: '1',
  resetTime: '0',
}

const mockChain = chainBuilder().build()

// Sepolia — the AllowanceModule is registered for it in @safe-global/safe-modules-deployments
const REGISTERED_CHAIN_ID = '11155111'

// Not a real chain: deployment bumps keep registering new networks, so any real id picked as
// "unregistered" eventually becomes registered (Optimism and Arbitrum did, in v3.0.9).
const UNREGISTERED_CHAIN_ID = '999999999999'

/**
 * WA-2305 / CUS-132 — "spending limits UI stuck at transaction creation".
 *
 * The review step does `createNewSpendingLimitTx(...).then(setSafeTx).catch(setSafeTxError)`, and
 * `ReviewTransaction` renders its skeleton while `!safeTx && !safeTxError`. A builder that resolves
 * `undefined` therefore parks the flow on an indefinite spinner: no error, no chain interaction, no
 * way out. Every unmet precondition must reject instead.
 */
describe('createNewSpendingLimitTx preconditions', () => {
  let mockSDK: Safe

  beforeEach(() => {
    jest.resetAllMocks()

    mockSDK = {
      createEnableModuleTx: jest.fn(() => ({ data: { data: '0x', to: ZERO_ADDRESS } })),
    } as unknown as Safe

    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(mockSDK)
    jest
      .spyOn(txSender, 'createMultiSendCallOnlyTx')
      .mockResolvedValue({ data: { to: ZERO_ADDRESS } } as unknown as SafeTransaction)
  })

  it('rejects instead of resolving undefined when the Safe SDK is unavailable', async () => {
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(undefined)

    await expect(createNewSpendingLimitTx(mockData, [], REGISTERED_CHAIN_ID, mockChain, [], true, 18)).rejects.toThrow(
      /Safe SDK could not be initialized/,
    )
  })

  it('rejects instead of resolving undefined when no module address resolves for the chain', async () => {
    await expect(
      createNewSpendingLimitTx(mockData, [], UNREGISTERED_CHAIN_ID, mockChain, [], true, 18),
    ).rejects.toThrow(NO_ALLOWANCE_MODULE_ERROR)
  })

  it('still resolves a transaction when the module resolves for the chain', async () => {
    const result = await createNewSpendingLimitTx(mockData, [], REGISTERED_CHAIN_ID, mockChain, [], true, 18)

    expect(result).toBeDefined()
    expect(txSender.createMultiSendCallOnlyTx).toHaveBeenCalledTimes(1)
  })
})
