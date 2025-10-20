import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { act, renderHook } from '@/tests/test-utils'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { useTxTracking } from '../useTxTracking'
import { trackEvent, WALLET_EVENTS } from '@/services/analytics'
import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { faker } from '@faker-js/faker'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getTransactionDetails: jest.fn(),
}))

describe('useTxTracking', () => {
  beforeEach(() => {
    ;(getTransactionDetails as jest.Mock).mockResolvedValue({
      safeAppInfo: { url: 'google.com' },
    } as unknown as TransactionDetails)
  })
  it('should track the ONCHAIN_INTERACTION event', async () => {
    renderHook(() => useTxTracking())

    txDispatch(TxEvent.PROCESSING, {
      nonce: 1,
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
