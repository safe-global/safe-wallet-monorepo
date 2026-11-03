import type { SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { Builder, type IBuilder } from '../Builder'

export const safeTxContextBuilder = (): IBuilder<SafeTxContextParams> =>
  Builder.new<SafeTxContextParams>().with({
    setSafeTx: jest.fn(),
    setSafeMessage: jest.fn(),
    setSafeMessageHash: jest.fn(),
    setSafeTxError: jest.fn(),
    setNonce: jest.fn(),
    setNonceNeeded: jest.fn(),
    setSafeTxGas: jest.fn(),
    setTxOrigin: jest.fn(),
    isReadOnly: false,
    gtfPaymentMode: 'safe',
    setGtfPaymentMode: jest.fn(),
    setGtfSelectedGasToken: jest.fn(),
  })
