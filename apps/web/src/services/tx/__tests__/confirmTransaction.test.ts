import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import confirmTx from '../confirmTransaction'
import { makeStore, setStoreInstance } from '@/store'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('confirmTx', () => {
  const CHAIN_ID = '1'
  const SAFE_ADDRESS = '0x0000000000000000000000000000000000000123'
  const SAFE_TX_HASH = '0x1234567890'
  const SIGNATURE = '0xabcdef01'
  const CONFIRMATIONS_URL = `${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_TX_HASH}/confirmations`
  const PROPOSE_URL = `${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`

  const mockResponse: TransactionDetails = {
    txId: `multisig_${SAFE_ADDRESS}_${SAFE_TX_HASH}`,
    safeAddress: SAFE_ADDRESS,
    txHash: undefined,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Custom',
      humanDescription: undefined,
      to: { value: '0x123', name: undefined, logoUri: undefined },
      dataSize: '100',
      value: '0',
      isCancellation: false,
      methodName: undefined,
    },
    detailedExecutionInfo: undefined,
    safeAppInfo: undefined,
    note: undefined,
  }

  beforeAll(() => {
    setStoreInstance(makeStore({}, { skipBroadcast: true }))
  })

  it('should return the updated transaction details', async () => {
    server.use(http.post(CONFIRMATIONS_URL, () => HttpResponse.json(mockResponse)))

    const confirmedTx = await confirmTx(CHAIN_ID, SAFE_TX_HASH, SIGNATURE)

    expect(confirmedTx).toEqual(mockResponse)
    expect(confirmedTx.txId).toBe(`multisig_${SAFE_ADDRESS}_${SAFE_TX_HASH}`)
  })

  it('should send only the signature as payload to the safeTxHash confirmations endpoint', async () => {
    let capturedBody: unknown
    const proposeHandler = jest.fn()

    server.use(
      http.post(CONFIRMATIONS_URL, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockResponse)
      }),
      http.post(PROPOSE_URL, () => {
        proposeHandler()
        return HttpResponse.json(mockResponse)
      }),
    )

    await confirmTx(CHAIN_ID, SAFE_TX_HASH, SIGNATURE)

    expect(capturedBody).toEqual({ signature: SIGNATURE })
    expect(proposeHandler).not.toHaveBeenCalled()
  })

  it('should throw an error with the gateway message and status code', async () => {
    server.use(
      http.post(CONFIRMATIONS_URL, () =>
        HttpResponse.json({ code: 422, message: 'Signer is not an owner' }, { status: 422 }),
      ),
    )

    await expect(confirmTx(CHAIN_ID, SAFE_TX_HASH, SIGNATURE)).rejects.toMatchObject({
      message: 'Signer is not an owner',
      status: 422,
    })
  })
})
