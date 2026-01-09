import { act, renderHook } from '@/tests/test-utils'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { useTxTracking } from '../useTxTracking'
import { trackEvent, WALLET_EVENTS } from '@/services/analytics'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

describe('useTxTracking', () => {
  beforeEach(() => {
    // Override the transaction endpoint to include safeAppInfo
    server.use(
      http.get<{ chainId: string; id: string }, never, TransactionDetails>(
        `${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`,
        () => {
          return HttpResponse.json({
            txInfo: {
              type: 'Custom',
              to: {
                value: '0x123',
                name: 'Test',
                logoUri: null,
              },
              dataSize: '100',
              value: null,
              isCancellation: false,
              methodName: 'test',
            },
            safeAddress: '0x456',
            txId: '0x345',
            txStatus: 'AWAITING_CONFIRMATIONS' as const,
            safeAppInfo: {
              name: 'Google',
              url: 'google.com',
              logoUri: null,
            },
          })
        },
      ),
    )
  })

  it('should track the ONCHAIN_INTERACTION event', async () => {
    renderHook(() => useTxTracking())

    txDispatch(TxEvent.PROCESSING, {
      nonce: 1,
      chainId: '1',
      safeAddress: faker.finance.ethereumAddress(),
      txId: '123',
      txHash: '0x123',
      signerAddress: faker.finance.ethereumAddress(),
      signerNonce: 0,
      gasLimit: 40_000,
      txType: 'SafeTx',
    })

    await act(() => Promise.resolve())

    expect(trackEvent).toHaveBeenCalledWith({
      ...WALLET_EVENTS.ONCHAIN_INTERACTION,
      label: 'google.com',
    })
  })

  it('should track relayed executions', () => {
    renderHook(() => useTxTracking())

    txDispatch(TxEvent.RELAYING, {
      chainId: '1',
      safeAddress: faker.finance.ethereumAddress(),
      taskId: '0x123',
      groupKey: '0x234',
    })
    expect(trackEvent).toBeCalledWith({ ...WALLET_EVENTS.ONCHAIN_INTERACTION, label: 'google.com' })
  })

  it('should track tx signing', async () => {
    renderHook(() => useTxTracking())

    txDispatch(TxEvent.SIGNED, {
      txId: '0x123',
    })
    await act(() => Promise.resolve())

    expect(trackEvent).toBeCalledWith({ ...WALLET_EVENTS.OFFCHAIN_SIGNATURE, label: 'google.com' })
  })

  it('should track tx execution', () => {
    renderHook(() => useTxTracking())

    txDispatch(TxEvent.PROCESSING, {
      nonce: 1,
      chainId: '1',
      safeAddress: faker.finance.ethereumAddress(),
      txId: '0x123',
      txHash: '0x234',
      signerAddress: faker.finance.ethereumAddress(),
      signerNonce: 0,
      gasLimit: 40_000,
      txType: 'SafeTx',
    })
    expect(trackEvent).toBeCalledWith({ ...WALLET_EVENTS.ONCHAIN_INTERACTION, label: 'google.com' })
  })
})
