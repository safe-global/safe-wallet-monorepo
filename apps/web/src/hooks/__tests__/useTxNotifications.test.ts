import { renderHook, waitFor } from '@/tests/test-utils'
import { OPAQUE_REVERT_MESSAGE } from '@safe-global/utils/services/exceptions/contractErrors'
import { mockCurrentChain } from '@/tests/mocks/hooks'
import { useAppSelector } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import useTxNotifications from '../useTxNotifications'

jest.mock('@/hooks/useChains')

jest.mock('@/hooks/useTxQueue', () => ({
  __esModule: true,
  default: () => ({ page: undefined, loading: false }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  __esModule: true,
  useLazyTransactionsGetTransactionByIdV1Query: () => [jest.fn().mockResolvedValue({ data: undefined })],
}))

// The exact shape ethers produces when MultiSendCallOnly does `revert(0, 0)`
const opaqueRevert = () =>
  Object.assign(
    new Error(
      'execution reverted (no data present; likely require(false) occurred (action="estimateGas", data="0x", reason="require(false)", transaction={ "data": "0x0075fe14a68278bda1623e877aa155a9c97d106e7" }, code=CALL_EXCEPTION, version=6.17.0)',
    ),
    { code: 'CALL_EXCEPTION', data: '0x', reason: 'require(false)' },
  )

const renderNotifications = () =>
  renderHook(() => {
    useTxNotifications()
    return useAppSelector(selectNotifications)
  })

const eventPayload = {
  txId: 'multisig_0x5AFE_0x1',
  groupKey: 'batch',
  chainId: '1',
  safeAddress: '0x0000000000000000000000000000000000005AFE',
}

describe('useTxNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentChain({ chainId: '1', chainName: 'Ethereum' })
  })

  it('replaces a data-less revert with the shared copy instead of "Require(false)"', async () => {
    const { result } = renderNotifications()

    txDispatch(TxEvent.FAILED, { ...eventPayload, error: opaqueRevert() })

    await waitFor(() => expect(result.current).toHaveLength(1))

    expect(result.current[0].message).toBe(OPAQUE_REVERT_MESSAGE)
    expect(result.current[0].message).not.toMatch(/require\(false\)/i)
  })

  it('never puts the raw revert payload behind Details', async () => {
    const { result } = renderNotifications()

    txDispatch(TxEvent.FAILED, { ...eventPayload, error: opaqueRevert() })

    await waitFor(() => expect(result.current).toHaveLength(1))

    // Nothing to reference: no GS code, and the raw dump must never be shown
    expect(result.current[0].detailedMessage).toBeUndefined()
  })

  it('keeps the code-only support reference for a revert we can name', async () => {
    const { result } = renderNotifications()

    const gsRevert = Object.assign(new Error('execution reverted: GS013 (data="0x...", version=6.17.0)'), {
      code: 'CALL_EXCEPTION',
      reason: 'GS013',
    })
    txDispatch(TxEvent.FAILED, { ...eventPayload, error: gsRevert })

    await waitFor(() => expect(result.current).toHaveLength(1))

    expect(result.current[0].detailedMessage).toBe('Error code GS013')
    expect(result.current[0].detailedMessage).not.toMatch(/version=/)
  })

  it('keeps our own hand-written copy for a non-revert failure', async () => {
    const { result } = renderNotifications()

    // The relay timeout message is the only explanation the user gets — it is
    // not a chain payload and must survive
    const timeout = new Error('Transaction not relayed in 3 minutes. Be aware that it might still be relayed.')
    txDispatch(TxEvent.FAILED, { ...eventPayload, error: timeout })

    await waitFor(() => expect(result.current).toHaveLength(1))

    expect(result.current[0].detailedMessage).toBe(timeout.message)
  })

  it('lets a mined revert keep its own message', async () => {
    const { result } = renderNotifications()

    txDispatch(TxEvent.REVERTED, { ...eventPayload, error: opaqueRevert() })

    await waitFor(() => expect(result.current).toHaveLength(1))

    expect(result.current[0].message).toBe('Transaction reverted on Ethereum. Gas was spent.')
  })
})
