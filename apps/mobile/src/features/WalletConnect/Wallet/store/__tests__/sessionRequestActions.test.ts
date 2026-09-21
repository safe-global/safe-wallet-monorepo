import type { AppDispatch, RootState } from '@/src/store'
import { switchActiveChain } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { proxyReadOnlyCall } from '../../services/readRpcProxy'
import { makeSwitchActiveChainByCaip2, makeGetCallsStatus, navigateToCallsStatus } from '../sessionRequestActions'

jest.mock('../../services/readRpcProxy', () => ({ proxyReadOnlyCall: jest.fn() }))
jest.mock('@/src/store/chains', () => ({ selectChainById: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockRouterPush(...args) } }))

const mockProxy = proxyReadOnlyCall as jest.Mock
const mockSelectChainById = selectChainById as jest.Mock

const SAFE = '0x1111111111111111111111111111111111111111'

const stateWith = (overrides: Partial<RootState> = {}): RootState =>
  ({
    activeSafe: { address: SAFE, chainId: '1' },
    safes: { [SAFE]: { '1': {} } },
    ...overrides,
  }) as unknown as RootState

const getStateReturning = (state: RootState) => () => state

beforeEach(() => jest.clearAllMocks())

describe('makeSwitchActiveChainByCaip2', () => {
  it('rejects (NOT_DEPLOYED) without dispatching when the chain config is unknown', async () => {
    mockSelectChainById.mockReturnValue(undefined)
    const dispatch = jest.fn() as unknown as AppDispatch

    const result = await makeSwitchActiveChainByCaip2(getStateReturning(stateWith()), dispatch)('eip155:137')

    expect(result).toEqual({ ok: false, reason: 'NOT_DEPLOYED' })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('rejects (NOT_DEPLOYED) without dispatching when the Safe is not deployed on the target chain', async () => {
    mockSelectChainById.mockReturnValue({ chainId: '137' })
    const dispatch = jest.fn() as unknown as AppDispatch
    const result = await makeSwitchActiveChainByCaip2(getStateReturning(stateWith()), dispatch)('eip155:137')

    expect(result).toEqual({ ok: false, reason: 'NOT_DEPLOYED' })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('switches the active chain and resolves ok when the Safe is deployed there', async () => {
    mockSelectChainById.mockReturnValue({ chainId: '137' })
    const dispatch = jest.fn() as unknown as AppDispatch
    const state = stateWith({ safes: { [SAFE]: { '1': {}, '137': {} } } as never })

    const result = await makeSwitchActiveChainByCaip2(getStateReturning(state), dispatch)('eip155:137')

    expect(result).toEqual({ ok: true })
    expect(dispatch).toHaveBeenCalledWith(switchActiveChain({ chainId: '137' }))
  })
})

describe('makeGetCallsStatus', () => {
  const dispatchResolving = (tx: unknown) =>
    jest.fn().mockReturnValue({ unwrap: () => Promise.resolve(tx) }) as unknown as AppDispatch

  const receipt = {
    logs: [],
    blockHash: '0xb',
    blockNumber: '0x10',
    gasUsed: '0x5',
    transactionHash: '0xtx',
  }

  it('throws "Transaction not found" when the CGW lookup rejects', async () => {
    const dispatch = jest
      .fn()
      .mockReturnValue({ unwrap: () => Promise.reject(new Error('404')) }) as unknown as AppDispatch

    await expect(makeGetCallsStatus(getStateReturning(stateWith()), dispatch)('eip155:1', '0xhash')).rejects.toThrow(
      'Transaction not found',
    )
    expect(mockProxy).not.toHaveBeenCalled()
  })

  it('returns a receipt-less envelope for a pending tx (no txHash)', async () => {
    const dispatch = dispatchResolving({ txStatus: 'AWAITING_EXECUTION', txHash: null })

    const result = await makeGetCallsStatus(getStateReturning(stateWith()), dispatch)('eip155:1', '0xhash')

    expect(result.status).toBe(100)
    expect(result.receipts).toBeUndefined()
    expect(mockProxy).not.toHaveBeenCalled()
  })

  it('fetches and attaches the receipt when a tx hash and chain config are present', async () => {
    mockSelectChainById.mockReturnValue({ chainId: '1' })
    mockProxy.mockResolvedValue(receipt)
    const dispatch = dispatchResolving({ txStatus: 'SUCCESS', txHash: '0xtx' })

    const result = await makeGetCallsStatus(getStateReturning(stateWith()), dispatch)('eip155:1', '0xhash')

    expect(mockProxy).toHaveBeenCalledWith({ chainId: '1' }, 'eth_getTransactionReceipt', ['0xtx'])
    expect(result.status).toBe(200)
    expect(result.receipts).toHaveLength(1)
    expect(result.receipts?.[0]).toMatchObject({ status: '0x1', transactionHash: '0xtx' })
  })

  it('falls back to a receipt-less envelope when the receipt fetch throws (non-fatal)', async () => {
    mockSelectChainById.mockReturnValue({ chainId: '1' })
    mockProxy.mockRejectedValue(new Error('RPC down'))
    const dispatch = dispatchResolving({ txStatus: 'SUCCESS', txHash: '0xtx' })

    const result = await makeGetCallsStatus(getStateReturning(stateWith()), dispatch)('eip155:1', '0xhash')

    expect(result.status).toBe(200)
    expect(result.receipts).toBeUndefined()
  })

  it('skips the receipt fetch when no chain config is available for the lookup', async () => {
    mockSelectChainById.mockReturnValue(undefined)
    const dispatch = dispatchResolving({ txStatus: 'SUCCESS', txHash: '0xtx' })

    const result = await makeGetCallsStatus(getStateReturning(stateWith()), dispatch)('eip155:1', '0xhash')

    expect(mockProxy).not.toHaveBeenCalled()
    expect(result.receipts).toBeUndefined()
  })
})

describe('navigateToCallsStatus', () => {
  it('pushes the pending-transactions route with the chain id and tx id', () => {
    navigateToCallsStatus('eip155:1', '0xhash')

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/pending-transactions',
      params: { chainId: 'eip155:1', txId: '0xhash' },
    })
  })
})
