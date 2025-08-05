import type { SafeTransaction } from '@safe-global/types-kit'
import { txDispatch, txSubscribe, TxEvent } from '../txEvents'
import { faker } from '@faker-js/faker'

const tx = {
  safeTxHash: '0x123',
} as unknown as SafeTransaction

describe('txEvents', () => {
  it('should dispatch and subscribe to the PROCESSING event', () => {
    const event = TxEvent.PROCESSING

    const detail = {
      nonce: 1,
      txId: '123',
      txHash: '0x123',
      signerAddress: faker.finance.ethereumAddress(),
      signerNonce: 0,
      gasLimit: 40_000,
      txType: 'SafeTx',
    } as const

    const callback = jest.fn()

    const unsubscribe = txSubscribe(event, callback)

    txDispatch(event, detail)

    expect(callback).toHaveBeenCalledWith(detail)

    const detail2 = {
      nonce: 1,
      txId: '123',
      txHash: '0x456',
      signerAddress: faker.finance.ethereumAddress(),
      signerNonce: 0,
      data: '0x123456',
      to: faker.finance.ethereumAddress(),
      txType: 'Custom',
    } as const

    txDispatch(event, detail2)

    expect(callback).toHaveBeenCalledWith(detail2)

    unsubscribe()

    txDispatch(event, detail)

    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should dispatch and subscribe to the FAILED event', () => {
    const event = TxEvent.FAILED

    const detail = {
      nonce: 1,
      txId: '0x123',
      tx,
      error: new Error('Tx failed'),
    }

    const callback = jest.fn()

    const unsubscribe = txSubscribe(event, callback)

    txDispatch(event, detail)

    expect(callback).toHaveBeenCalledWith(detail)

    unsubscribe()

    txDispatch(event, detail)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
