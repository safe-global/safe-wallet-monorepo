import { faker } from '@faker-js/faker'
import { configureStore } from '@reduxjs/toolkit'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'
import { server } from '@/src/tests/server'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import draftTxReducer from '@/src/store/draftTxSlice'
import { prepareSendDraft } from './prepareSendDraft'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

jest.mock('@/src/hooks/coreSDK/safeCoreSDK', () => ({
  getSafeSDK: jest.fn(),
}))

const mockedGetSafeSDK = getSafeSDK as jest.MockedFunction<typeof getSafeSDK>

const createTestStore = () => {
  return configureStore({
    reducer: {
      draftTx: draftTxReducer,
      [cgwClient.reducerPath]: cgwClient.reducer,
    },
    middleware: (gdm) => gdm({ serializableCheck: false }).concat(cgwClient.middleware),
  })
}

const buildSafe = (overrides: Partial<SafeState> = {}): SafeState =>
  ({
    address: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
    chainId: '1',
    nonce: 0,
    threshold: 2,
    owners: [
      { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
      { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
    ],
    implementation: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
    implementationVersionState: 'UP_TO_DATE',
    ...overrides,
  }) as SafeState

describe('prepareSendDraft', () => {
  const chainId = '1'
  const safeAddress = faker.finance.ethereumAddress()
  const sender = faker.finance.ethereumAddress()
  const recipient = faker.finance.ethereumAddress()
  const tokenAddress = '0x0000000000000000000000000000000000000000'
  let safeTxHashReturned: string

  beforeEach(() => {
    safeTxHashReturned = `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`
    const fakeSafeTx = {
      data: {
        to: recipient,
        value: '0',
        data: '0x',
        operation: 0,
        nonce: 5,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
      },
    }
    mockedGetSafeSDK.mockReturnValue({
      getChainId: jest.fn().mockResolvedValue(BigInt(chainId)),
      createTransaction: jest.fn().mockResolvedValue(fakeSafeTx),
      getTransactionHash: jest.fn().mockResolvedValue(safeTxHashReturned),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  it('calls /preview, synthesizes a draft, dispatches setDraft, and never calls /propose', async () => {
    let previewCalls = 0
    let proposeCalled = false
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${chainId}/transactions/${safeAddress}/preview`, () => {
        previewCalls += 1
        return HttpResponse.json({
          txInfo: {
            type: 'Transfer',
            sender: { value: sender, name: null, logoUri: null },
            recipient: { value: recipient, name: null, logoUri: null },
            direction: 'OUTGOING',
            transferInfo: { type: 'NATIVE_COIN', value: '1000' },
          },
          txData: {
            to: { value: recipient, name: null, logoUri: null },
            value: '1000',
            operation: 0,
            trustedDelegateCallTarget: null,
            addressInfoIndex: null,
            tokenInfoIndex: null,
          },
        })
      }),
      http.post(`${GATEWAY_URL}/v1/chains/${chainId}/transactions/${safeAddress}/propose`, () => {
        proposeCalled = true
        return HttpResponse.json({})
      }),
    )

    const store = createTestStore()
    const safe = buildSafe()

    const returnedHash = await prepareSendDraft({
      recipient,
      tokenAddress,
      amount: '0.000001',
      decimals: 18,
      chainId,
      safeAddress,
      dispatch: store.dispatch,
      nonce: 5,
      safe,
    })

    expect(returnedHash).toBe(safeTxHashReturned)
    expect(previewCalls).toBe(1)
    expect(proposeCalled).toBe(false)

    const draft = store.getState().draftTx.drafts[safeTxHashReturned]
    expect(draft).toBeDefined()
    expect(draft.chainId).toBe(chainId)
    expect(draft.safeAddress).toBe(safeAddress)
    expect(draft.txDetails.txId).toBe(safeTxHashReturned)
    expect(draft.txDetails.txStatus).toBe('AWAITING_CONFIRMATIONS')
  })

  it('throws and does not store a draft when /preview fails', async () => {
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${chainId}/transactions/${safeAddress}/preview`, () =>
        HttpResponse.json({ error: 'bad request' }, { status: 400 }),
      ),
    )

    const store = createTestStore()
    const safe = buildSafe()

    await expect(
      prepareSendDraft({
        recipient,
        tokenAddress,
        amount: '0.000001',
        decimals: 18,
        chainId,
        safeAddress,
        dispatch: store.dispatch,
        safe,
      }),
    ).rejects.toBeTruthy()

    expect(Object.keys(store.getState().draftTx.drafts)).toHaveLength(0)
  })

  it('throws when an invalid recipient is supplied (before any network call)', async () => {
    let previewCalled = false
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/${chainId}/transactions/${safeAddress}/preview`, () => {
        previewCalled = true
        return HttpResponse.json({})
      }),
    )

    const store = createTestStore()
    const safe = buildSafe()

    await expect(
      prepareSendDraft({
        recipient: 'not-an-address',
        tokenAddress,
        amount: '0.000001',
        decimals: 18,
        chainId,
        safeAddress,
        dispatch: store.dispatch,
        safe,
      }),
    ).rejects.toThrow(/Invalid recipient address/)

    expect(previewCalled).toBe(false)
  })
})
