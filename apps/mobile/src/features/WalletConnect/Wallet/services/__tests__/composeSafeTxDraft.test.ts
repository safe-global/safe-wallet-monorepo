import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { composeSafeTxDraft, type DappCall } from '../composeSafeTxDraft'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { synthesizeDraftTxDetails } from '@/src/features/ConfirmTx/utils/synthesizeDraftTxDetails'
import { getCreateCallContractDeployment } from '@safe-global/utils/services/contracts/deployments'
import { setDraft } from '@/src/store/draftTxSlice'

jest.mock('@/src/hooks/coreSDK/safeCoreSDK')
jest.mock('@/src/features/ConfirmTx/utils/synthesizeDraftTxDetails')
jest.mock('@safe-global/utils/services/contracts/deployments')

const mockGetSafeSDK = getSafeSDK as jest.Mock
const mockSynthesize = synthesizeDraftTxDetails as jest.Mock
const mockGetCreateCall = getCreateCallContractDeployment as jest.Mock

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const CHAIN_ID = '1'
const SAFE_TX_HASH = '0xdeadbeef'

const chain = { chainId: CHAIN_ID } as unknown as Chain
const safe = {
  version: '1.3.0',
  owners: [{ value: SAFE_ADDRESS }],
  threshold: 1,
} as unknown as SafeState

let createTransaction: jest.Mock

const makeSdk = () => {
  createTransaction = jest.fn(async ({ transactions }: { transactions: unknown[] }) => ({
    data: { to: '0xto', value: '0', data: '0x', operation: 0, nonce: 0, transactions },
  }))
  return {
    getChainId: jest.fn(async () => BigInt(CHAIN_ID)),
    createTransaction,
    getTransactionHash: jest.fn(async () => SAFE_TX_HASH),
  }
}

// dispatch: RTK Query initiate returns a thunk (function); plain actions are objects.
// The preview thunk resolves to { data } / { error } and carries a .reset() method.
const makeDispatch = (previewResult: unknown) => {
  const reset = jest.fn()
  const dispatch = jest.fn((action: unknown) => {
    if (typeof action === 'function') {
      const p = Promise.resolve(previewResult) as Promise<unknown> & { reset: jest.Mock }
      p.reset = reset
      return p
    }
    return action
  })
  return { dispatch, reset }
}

const run = (calls: DappCall[], previewResult: unknown = { data: { txInfo: {} } }) => {
  const { dispatch, reset } = makeDispatch(previewResult)
  return {
    promise: composeSafeTxDraft({
      calls,
      chainId: CHAIN_ID,
      safeAddress: SAFE_ADDRESS,
      safe,
      chain,
      dispatch: dispatch as never,
    }),
    dispatch,
    reset,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetSafeSDK.mockReturnValue(makeSdk())
  mockSynthesize.mockReturnValue({ txId: SAFE_TX_HASH })
})

describe('composeSafeTxDraft', () => {
  it('throws on an empty calls array', async () => {
    await expect(run([]).promise).rejects.toThrow('empty calls array')
  })

  it('composes a single call and stashes a draft keyed by safeTxHash', async () => {
    const { promise, dispatch } = run([{ to: '0xabc', value: '0x0', data: '0x' }])
    const hash = await promise
    expect(hash).toBe(SAFE_TX_HASH)
    expect(createTransaction).toHaveBeenCalledWith({
      transactions: [{ to: '0xabc', value: '0', data: '0x', operation: 0 }],
    })
    expect(dispatch).toHaveBeenCalledWith(setDraft(expect.objectContaining({ safeTxHash: SAFE_TX_HASH })))
  })

  it('normalizes a hex value to a decimal string', async () => {
    // 0x16345785d8a0000 == 100000000000000000 (0.1 ETH)
    await run([{ to: '0xabc', value: '0x16345785d8a0000', data: '0x' }]).promise
    expect(createTransaction).toHaveBeenCalledWith({
      transactions: [{ to: '0xabc', value: '100000000000000000', data: '0x', operation: 0 }],
    })
  })

  it('wraps a batch of calls into a single SafeTransaction', async () => {
    await run([
      { to: '0xaaa', value: '0x1', data: '0x' },
      { to: '0xbbb', value: '0x0', data: '0xfeed' },
    ]).promise
    expect(createTransaction).toHaveBeenCalledWith({
      transactions: [
        { to: '0xaaa', value: '1', data: '0x', operation: 0 },
        { to: '0xbbb', value: '0', data: '0xfeed', operation: 0 },
      ],
    })
  })

  it('routes a no-to + data-only call through CreateCall', async () => {
    mockGetCreateCall.mockReturnValue({
      abi: ['function performCreate(uint256 value, bytes deploymentData) returns (address)'],
      networkAddresses: { [CHAIN_ID]: '0xCreateCall' },
    })
    await run([{ data: '0xdeadbeef' }]).promise
    const { transactions } = createTransaction.mock.calls[0][0]
    expect(transactions[0].to).toBe('0xCreateCall')
    expect(transactions[0].operation).toBe(0)
    expect(transactions[0].data).toMatch(/^0x/)
  })

  it('throws when the SDK is on a different chain', async () => {
    mockGetSafeSDK.mockReturnValue({ ...makeSdk(), getChainId: jest.fn(async () => BigInt(137)) })
    await expect(run([{ to: '0xabc' }]).promise).rejects.toThrow(/Chain mismatch/)
  })

  it('throws and stashes no draft when the preview fails', async () => {
    const { promise, dispatch, reset } = run([{ to: '0xabc' }], { error: { status: 500 } })
    await expect(promise).rejects.toBeDefined()
    expect(reset).toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalledWith(setDraft(expect.anything()))
  })
})
