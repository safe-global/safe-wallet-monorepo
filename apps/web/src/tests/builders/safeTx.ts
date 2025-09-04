import { Builder, type IBuilder } from '@/tests/Builder'
import { faker } from '@faker-js/faker'
import { type SafeTransactionData, type SafeSignature, type SafeTransaction } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import {
  type Custom,
  DetailedExecutionInfoType,
  type MultisigExecutionInfo,
  Operation,
  type TransactionInfo,
  TransactionInfoType,
  type TransactionSummary,
  type TransactionData,
} from '@safe-global/safe-gateway-typescript-sdk'
import { TransactionStatus } from '@safe-global/safe-apps-sdk'

// TODO: Convert to builder
export const createSafeTx = (data = '0x'): SafeTransaction => {
  return {
    data: {
      to: '0x0000000000000000000000000000000000000000',
      value: '0x0',
      data,
      operation: 0,
      nonce: 100,
    },
    signatures: new Map([]),
    addSignature: function (sig: SafeSignature): void {
      this.signatures.set(sig.signer, sig)
    },
    encodedSignatures: function (): string {
      return Array.from(this.signatures)
        .map(([, sig]) => {
          return [sig.signer, sig.data].join(' = ')
        })
        .join('; ')
    },
  } as SafeTransaction
}

export function safeTxBuilder(): IBuilder<SafeTransaction> {
  return Builder.new<SafeTransaction>().with({
    data: safeTxDataBuilder().build(),
    signatures: new Map([]),
    addSignature: function (sig: SafeSignature): void {
      this.signatures!.set(sig.signer, sig)
    },
    encodedSignatures: function (): string {
      return Array.from(this.signatures!)
        .map(([, sig]) => {
          return [sig.signer, sig.data].join(' = ')
        })
        .join('; ')
    },
  })
}

export function safeTxDataBuilder(): IBuilder<SafeTransactionData> {
  return Builder.new<SafeTransactionData>().with({
    to: faker.finance.ethereumAddress(),
    value: '0x0',
    data: faker.string.hexadecimal({ length: faker.number.int({ max: 500 }) }),
    operation: 0,
    nonce: faker.number.int(),
    safeTxGas: faker.number.toString(),
    gasPrice: faker.number.toString(),
    gasToken: ZERO_ADDRESS,
    baseGas: faker.number.toString(),
    refundReceiver: faker.finance.ethereumAddress(),
  })
}

export function safeSignatureBuilder(): IBuilder<SafeSignature> {
  return Builder.new<SafeSignature>().with({
    signer: faker.finance.ethereumAddress(),
    data: faker.string.hexadecimal({ length: faker.number.int({ max: 500 }) }),
  })
}

export function safeTxSummaryBuilder(): IBuilder<TransactionSummary> {
  return Builder.new<TransactionSummary>().with({
    id: `multisig_${faker.string.hexadecimal({ length: 40 })}_${faker.string.hexadecimal({ length: 64 })}`,
    executionInfo: executionInfoBuilder().build(),
    txInfo: txInfoBuilder().build(),
    txStatus: faker.helpers.enumValue(TransactionStatus),
  })
}

export function executionInfoBuilder(): IBuilder<MultisigExecutionInfo> {
  const num1 = faker.number.int({ min: 1, max: 10 })
  const num2 = faker.number.int({ min: 1, max: 10 })

  return Builder.new<MultisigExecutionInfo>().with({
    nonce: faker.number.int(),
    type: DetailedExecutionInfoType.MULTISIG,
    confirmationsRequired: Math.max(num1, num2),
    confirmationsSubmitted: Math.min(num1, num2),
    missingSigners: Array.from({ length: Math.min(num1, num2) }).map(() => ({
      value: faker.finance.ethereumAddress(),
    })),
  })
}

export function txInfoBuilder(): IBuilder<TransactionInfo> {
  const mockData = faker.string.hexadecimal({ length: { min: 0, max: 128 } })
  return Builder.new<Custom>().with({
    type: TransactionInfoType.CUSTOM,
    actionCount: 1,
    dataSize: mockData.length.toString(),
    isCancellation: false,
    methodName: faker.string.alpha(),
    to: { value: faker.finance.ethereumAddress() },
    value: faker.number.bigInt({ min: 0, max: 10n ** 18n }).toString(),
  })
}

export function txDataBuilder(): IBuilder<TransactionData> {
  return Builder.new<TransactionData>().with({
    hexData: faker.string.hexadecimal({ length: faker.number.int({ max: 128 }) }),
    to: { value: faker.finance.ethereumAddress() },
    addressInfoIndex: {},
    value: faker.string.numeric({ length: { min: 1, max: 1000 } }),
    operation: faker.helpers.enumValue(Operation),
    trustedDelegateCallTarget: true,
    dataDecoded: undefined,
  })
}
