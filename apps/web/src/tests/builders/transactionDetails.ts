import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type {
  TransactionDetails,
  MultisigExecutionDetails,
  MultisigConfirmationDetails,
  AddressInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType, TransferDirection, TransactionTokenType } from '@safe-global/store/gateway/types'

import { Builder, type IBuilder } from '../Builder'

const addressInfoBuilder = (): IBuilder<AddressInfo> => {
  return Builder.new<AddressInfo>().with({
    value: checksumAddress(faker.finance.ethereumAddress()),
    name: faker.word.words(),
    logoUri: faker.image.url(),
  })
}

export const multisigConfirmationBuilder = (): IBuilder<MultisigConfirmationDetails> => {
  return Builder.new<MultisigConfirmationDetails>().with({
    signer: addressInfoBuilder().build(),
    signature: faker.string.hexadecimal({ length: 130 }),
    submittedAt: faker.date.recent().getTime(),
  })
}

export const multisigExecutionDetailsBuilder = (): IBuilder<MultisigExecutionDetails> => {
  const signer = addressInfoBuilder().build()
  return Builder.new<MultisigExecutionDetails>().with({
    type: 'MULTISIG' as const,
    submittedAt: faker.date.recent().getTime(),
    nonce: faker.number.int({ min: 0, max: 1000 }),
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: checksumAddress('0x0000000000000000000000000000000000000000'),
    refundReceiver: addressInfoBuilder().build(),
    safeTxHash: faker.string.hexadecimal({ length: 64 }),
    executor: null,
    signers: [signer],
    confirmationsRequired: 1,
    confirmations: [multisigConfirmationBuilder().with({ signer }).build()],
    rejectors: [],
    gasTokenInfo: null,
    trusted: true,
    proposer: signer,
    proposedByDelegate: null,
  })
}

export const transactionDataBuilder = (): IBuilder<TransactionData> => {
  return Builder.new<TransactionData>().with({
    hexData: null,
    dataDecoded: null,
    to: addressInfoBuilder().build(),
    value: '0',
    operation: 0,
    trustedDelegateCallTarget: null,
    addressInfoIndex: null,
    tokenInfoIndex: null,
  })
}

export const transactionDetailsBuilder = (): IBuilder<TransactionDetails> => {
  return Builder.new<TransactionDetails>().with({
    txId: `multisig_0x${faker.string.hexadecimal({ length: 40 })}_0x${faker.string.hexadecimal({ length: 64 })}`,
    safeAddress: checksumAddress(faker.finance.ethereumAddress()),
    txStatus: 'AWAITING_CONFIRMATIONS' as const,
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      sender: addressInfoBuilder().build(),
      recipient: addressInfoBuilder().build(),
      direction: TransferDirection.OUTGOING,
      transferInfo: {
        type: TransactionTokenType.NATIVE_COIN,
        value: faker.string.numeric({ length: { min: 1, max: 20 } }),
      },
    },
    txData: transactionDataBuilder().build(),
    detailedExecutionInfo: multisigExecutionDetailsBuilder().build(),
    executedAt: null,
    txHash: null,
    safeAppInfo: null,
    note: null,
  })
}
