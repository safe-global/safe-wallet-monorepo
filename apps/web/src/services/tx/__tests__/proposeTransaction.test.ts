import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { createMockSafeTransaction } from '@/tests/transactions'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import proposeTx from '../proposeTransaction'
import { makeStore, setStoreInstance } from '@/store'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('proposeTx', () => {
  const CHAIN_ID = '1'
  const SAFE_ADDRESS = '0x0000000000000000000000000000000000000123'
  const SENDER_ADDRESS = '0x1234567890123456789012345678901234567890'
  const SAFE_TX_HASH = '0x1234567890'

  beforeAll(() => {
    const testStore = makeStore({}, { skipBroadcast: true })
    setStoreInstance(testStore)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should propose an unsigned transaction', async () => {
    const mockResponse: TransactionDetails = {
      txId: '123',
      safeAddress: SAFE_ADDRESS,
      txInfo: {
        type: 'Custom',
        humanDescription: undefined,
        to: {
          value: '0x123',
          name: undefined,
          logoUri: undefined,
        },
        dataSize: '100',
        value: undefined,
        isCancellation: false,
        methodName: undefined,
      },
      txHash: undefined,
      txStatus: 'AWAITING_CONFIRMATIONS',
      detailedExecutionInfo: undefined,
      safeAppInfo: undefined,
      note: undefined,
    }

    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, () => {
        return HttpResponse.json(mockResponse)
      }),
    )

    const tx = createMockSafeTransaction({
      to: '0x123',
      value: '1',
      data: '0x0',
    })

    const proposedTx = await proposeTx(CHAIN_ID, SAFE_ADDRESS, SENDER_ADDRESS, tx, SAFE_TX_HASH)

    expect(proposedTx).toEqual(mockResponse)
    expect(proposedTx.txId).toBe('123')
  })

  it('should propose a signed transaction', async () => {
    const mockResponse: TransactionDetails = {
      txId: '456',
      safeAddress: SAFE_ADDRESS,
      txInfo: {
        type: 'Custom',
        humanDescription: undefined,
        to: {
          value: '0x456',
          name: undefined,
          logoUri: undefined,
        },
        dataSize: '100',
        value: '100',
        isCancellation: false,
        methodName: undefined,
      },
      txHash: '0xabcdef',
      txStatus: 'AWAITING_CONFIRMATIONS',
      detailedExecutionInfo: {
        type: 'MULTISIG',
        nonce: 1,
        confirmationsRequired: 2,
        confirmations: [],
        submittedAt: Date.now(),
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: { value: '0x0000000000000000000000000000000000000000' },
        safeTxHash: '0x0',
        signers: [],
        rejectors: [],
        trusted: false,
      },
      safeAppInfo: undefined,
      note: undefined,
    }

    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, () => {
        return HttpResponse.json(mockResponse)
      }),
    )

    const tx = createMockSafeTransaction({
      to: '0x456',
      value: '100',
      data: '0x0',
    })
    tx.addSignature(generatePreValidatedSignature(SENDER_ADDRESS))

    const proposedTx = await proposeTx(CHAIN_ID, SAFE_ADDRESS, SENDER_ADDRESS, tx, SAFE_TX_HASH)

    expect(proposedTx).toEqual(mockResponse)
    expect(proposedTx.txId).toBe('456')
    expect(proposedTx.txStatus).toBe('AWAITING_CONFIRMATIONS')
  })

  it('should propose a transaction with origin', async () => {
    const mockResponse: TransactionDetails = {
      txId: '789',
      safeAddress: SAFE_ADDRESS,
      txInfo: {
        type: 'Custom',
        humanDescription: undefined,
        to: {
          value: '0x789',
          name: undefined,
          logoUri: undefined,
        },
        dataSize: '100',
        value: undefined,
        isCancellation: false,
        methodName: undefined,
      },
      txHash: undefined,
      txStatus: 'AWAITING_CONFIRMATIONS',
      detailedExecutionInfo: undefined,
      safeAppInfo: {
        name: 'Test App',
        url: 'https://test.app',
      },
      note: undefined,
    }

    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, async ({ request }) => {
        const body = (await request.json()) as any
        expect(body.origin).toBe('https://test.app')
        return HttpResponse.json(mockResponse)
      }),
    )

    const tx = createMockSafeTransaction({
      to: '0x789',
      value: '0',
      data: '0x0',
    })

    const proposedTx = await proposeTx(CHAIN_ID, SAFE_ADDRESS, SENDER_ADDRESS, tx, SAFE_TX_HASH, 'https://test.app')

    expect(proposedTx).toEqual(mockResponse)
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, () => {
        return HttpResponse.json({ message: 'Invalid transaction' }, { status: 400 })
      }),
    )

    const tx = createMockSafeTransaction({
      to: '0x123',
      value: '1',
      data: '0x0',
    })

    await expect(proposeTx(CHAIN_ID, SAFE_ADDRESS, SENDER_ADDRESS, tx, SAFE_TX_HASH)).rejects.toThrow()
  })

  it('should throw an error with proper message when propose endpoint returns 422', async () => {
    const errorResponse = {
      code: 422,
      message: 'Just one signature is expected if using delegates',
    }

    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, () => {
        return HttpResponse.json(errorResponse, { status: 422 })
      }),
    )

    const tx = createMockSafeTransaction({
      to: '0x123',
      value: '1',
      data: '0x0',
    })

    await expect(proposeTx(CHAIN_ID, SAFE_ADDRESS, SENDER_ADDRESS, tx, SAFE_TX_HASH)).rejects.toThrow(
      'Just one signature is expected if using delegates',
    )
  })

  it('should preserve status code in error when propose endpoint returns 422', async () => {
    const errorResponse = {
      code: 422,
      message: 'Just one signature is expected if using delegates',
    }

    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, () => {
        return HttpResponse.json(errorResponse, { status: 422 })
      }),
    )

    const tx = createMockSafeTransaction({
      to: '0x123',
      value: '1',
      data: '0x0',
    })

    try {
      await proposeTx(CHAIN_ID, SAFE_ADDRESS, SENDER_ADDRESS, tx, SAFE_TX_HASH)
      fail('Expected proposeTx to throw an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as any).status).toBe(422)
      expect((error as Error).message).toBe('Just one signature is expected if using delegates')
      // Verify it's not displaying "[object Object]"
      expect((error as Error).message).not.toContain('[object Object]')
    }
  })

  it('should include correct transaction data in the request', async () => {
    let capturedRequest: any

    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/${SAFE_ADDRESS}/propose`, async ({ request }) => {
        capturedRequest = await request.json()
        return HttpResponse.json({
          txId: '123',
          safeAddress: SAFE_ADDRESS,
          txInfo: {
            type: 'Custom',
            to: { value: '0x123' },
            dataSize: '100',
            isCancellation: false,
          },
          txStatus: 'AWAITING_CONFIRMATIONS',
        })
      }),
    )

    const tx = createMockSafeTransaction({
      to: '0x999',
      value: '500',
      data: '0xabcd',
    })

    await proposeTx(CHAIN_ID, SAFE_ADDRESS, SENDER_ADDRESS, tx, SAFE_TX_HASH)

    expect(capturedRequest).toMatchObject({
      to: '0x999',
      value: '500',
      data: '0xabcd',
      operation: 0,
      safeTxHash: SAFE_TX_HASH,
      sender: SENDER_ADDRESS,
    })

    // Verify all required fields are present
    expect(capturedRequest.nonce).toBeDefined()
    expect(capturedRequest.safeTxGas).toBeDefined()
    expect(capturedRequest.baseGas).toBeDefined()
    expect(capturedRequest.gasPrice).toBeDefined()
  })
})
