import { useValidateTxPreview } from '../useValidateTxPreview'
import { ZeroAddress } from 'ethers'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { TransactionInfoType, type TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import { faker } from '@faker-js/faker'
import { ERC20__factory } from '@/types/contracts'

const erc20Interface = ERC20__factory.createInterface()
describe('useValidateTxPreview', () => {
  const toAddress = faker.finance.ethereumAddress()

  const transferTo = faker.finance.ethereumAddress()
  const mockTxPreview: TransactionPreview = {
    txData: {
      to: { value: toAddress },
      operation: 0,
      value: '0',
      hexData: erc20Interface.encodeFunctionData('transfer', [transferTo, '69']),
      dataDecoded: {
        method: 'transfer',
        parameters: [
          { type: 'address', value: transferTo, name: '_to' },
          { type: 'uint256', value: '69', name: '_value' },
        ],
      },
      trustedDelegateCallTarget: true,
    },
    txInfo: {
      type: TransactionInfoType.CUSTOM,
      to: { value: toAddress },
      dataSize: '68',
      isCancellation: false,
      value: '0',
      actionCount: 0,
    },
  }

  const mockSafeTxData: SafeTransaction['data'] = {
    to: toAddress,
    value: '0',
    data: erc20Interface.encodeFunctionData('transfer', [transferTo, '69']),
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZeroAddress,
    nonce: 0,
    refundReceiver: ZeroAddress,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate the transaction preview successfully', () => {
    expect(useValidateTxPreview(mockTxPreview, mockSafeTxData)).toBeUndefined()
  })

  it('should validate fallback function calls successfully', () => {
    const randomTxData = faker.string.hexadecimal({ length: 8 })
    const mockFallbackTxPreview: TransactionPreview = {
      txData: {
        to: { value: toAddress },
        operation: 0,
        value: '420',
        hexData: randomTxData,
        dataDecoded: {
          method: 'fallback',
          parameters: [],
        },
        trustedDelegateCallTarget: true,
      },
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        to: { value: toAddress },
        dataSize: '68',
        isCancellation: false,
        value: '0',
        actionCount: 0,
      },
    }

    const mockFallbackSafeTxData: SafeTransaction['data'] = {
      to: toAddress,
      value: '420',
      data: randomTxData,
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ZeroAddress,
      nonce: 0,
      refundReceiver: ZeroAddress,
    }

    expect(useValidateTxPreview(mockFallbackTxPreview, mockFallbackSafeTxData)).toBeUndefined()
  })

  it('should throw InvalidPreviewError if top level data does not match', () => {
    expect(
      useValidateTxPreview({ ...mockTxPreview, txData: { ...mockTxPreview.txData, operation: 1 } }, mockSafeTxData)
        ?.message,
    ).toEqual("SafeTx data does not match the preview result's transaction data")
  })

  it('should throw InvalidPreviewError if decoded data does not match raw data', () => {
    // Different receiver of erc20 transfer in raw data than in the decoded data
    const newReceiver = faker.finance.ethereumAddress()
    expect(
      useValidateTxPreview(
        {
          ...mockTxPreview,
          txData: {
            ...mockTxPreview.txData,
            hexData: erc20Interface.encodeFunctionData('transfer', [newReceiver, 69]),
          },
        },
        {
          ...mockSafeTxData,
          data: erc20Interface.encodeFunctionData('transfer', [newReceiver, 69]),
        },
      )?.message,
    ).toEqual('Decoded data does not match raw data')
  })
})
