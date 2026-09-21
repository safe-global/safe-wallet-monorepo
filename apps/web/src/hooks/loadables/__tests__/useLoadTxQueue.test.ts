import { act, renderHook, waitFor } from '@/tests/test-utils'
import useLoadTxQueue from '@/hooks/loadables/useLoadTxQueue'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as transactionsService from '@/services/transactions'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { faker } from '@faker-js/faker'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const SAFE_ADDRESS = faker.finance.ethereumAddress()
const CHAIN_ID = '1'
const TX_ID = `multisig_${SAFE_ADDRESS}_${faker.string.hexadecimal({ length: 64 })}`

describe('useLoadTxQueue', () => {
  const emptyPage: QueuedItemPage = { results: [] }
  let getTransactionQueue: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: SAFE_ADDRESS }, chainId: CHAIN_ID })
        .build(),
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    getTransactionQueue = jest.spyOn(transactionsService, 'getTransactionQueue').mockResolvedValue(emptyPage)
  })

  const renderAndSettle = async () => {
    const result = renderHook(() => useLoadTxQueue())
    await waitFor(() => expect(getTransactionQueue).toHaveBeenCalledTimes(1))
    return result
  }

  it('fetches the queue for the current Safe', async () => {
    await renderAndSettle()

    expect(getTransactionQueue).toHaveBeenCalledWith(CHAIN_ID, SAFE_ADDRESS)
  })

  it.each([
    [TxEvent.PROPOSED, { txId: TX_ID, nonce: 1 }],
    [TxEvent.DELETED, { safeTxHash: faker.string.hexadecimal({ length: 64 }) }],
    [
      TxEvent.SIGNATURE_PROPOSED,
      {
        txId: TX_ID,
        nonce: 1,
        signerAddress: faker.finance.ethereumAddress(),
        chainId: CHAIN_ID,
        safeAddress: SAFE_ADDRESS,
      },
    ],
  ] as const)('reloads the queue on %s', async (event, detail) => {
    await renderAndSettle()

    act(() => {
      txDispatch(event, detail)
    })

    await waitFor(() => expect(getTransactionQueue).toHaveBeenCalledTimes(2))
  })

  it('reloads the queue for each signature added to the same transaction', async () => {
    await renderAndSettle()

    const signature = (signerAddress: string) => ({
      txId: TX_ID,
      nonce: 1,
      signerAddress,
      chainId: CHAIN_ID,
      safeAddress: SAFE_ADDRESS,
    })

    act(() => {
      txDispatch(TxEvent.SIGNATURE_PROPOSED, signature(faker.finance.ethereumAddress()))
    })
    await waitFor(() => expect(getTransactionQueue).toHaveBeenCalledTimes(2))

    act(() => {
      txDispatch(TxEvent.SIGNATURE_PROPOSED, signature(faker.finance.ethereumAddress()))
    })
    await waitFor(() => expect(getTransactionQueue).toHaveBeenCalledTimes(3))
  })

  it('stops reloading after unmount', async () => {
    const { unmount } = await renderAndSettle()

    unmount()
    act(() => {
      txDispatch(TxEvent.PROPOSED, { txId: TX_ID, nonce: 1 })
    })

    expect(getTransactionQueue).toHaveBeenCalledTimes(1)
  })
})
