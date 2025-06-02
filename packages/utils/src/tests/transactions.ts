import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { solidityPacked, concat } from 'ethers'
import { OperationType } from '@safe-global/types-kit'
import type { SafeTransaction } from '@safe-global/types-kit'

import { ERC20__factory, ERC721__factory, Multi_send__factory } from '@safe-global/utils/types/contracts'
import EthSafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { TransactionStatus } from '@safe-global/safe-apps-sdk'

export const getMockErc20TransferCalldata = (to: string) => {
  const erc20Interface = ERC20__factory.createInterface()
  return erc20Interface.encodeFunctionData('transfer', [
    to,
    0, // value
  ])
}

export const getMockErc721TransferFromCalldata = (to: string) => {
  const erc721Interface = ERC721__factory.createInterface()
  return erc721Interface.encodeFunctionData('transferFrom', [
    ZERO_ADDRESS, // from
    to,
    0, // value
  ])
}

export const getMockErc721SafeTransferFromCalldata = (to: string) => {
  const erc721Interface = ERC721__factory.createInterface()
  return erc721Interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [
    ZERO_ADDRESS, // from
    to,
    0, // value
  ])
}

export const getMockErc721SafeTransferFromWithBytesCalldata = (to: string) => {
  const erc721Interface = ERC721__factory.createInterface()
  return erc721Interface.encodeFunctionData('safeTransferFrom(address,address,uint256,bytes)', [
    ZERO_ADDRESS, // from
    to,
    0, // value
    '0x', // bytes
  ])
}

export const getMockMultiSendCalldata = (recipients: Array<string>): string => {
  // MultiSendCallOnly
  const OPERATION = 0

  const data = '0x'

  const internalTransactions = recipients.map((recipient) => {
    return solidityPacked(
      ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
      [
        OPERATION,
        recipient,
        0, // value
        data.length, // dataLength
        data, // data
      ],
    )
  })

  const multiSendInterface = Multi_send__factory.createInterface()
  return multiSendInterface.encodeFunctionData('multiSend', [concat(internalTransactions)])
}

export const createMockTransactionDetails = ({
  txInfo,
  txData,
  detailedExecutionInfo,
}: {
  txInfo: TransactionDetails['txInfo']
  txData: TransactionDetails['txData']
  detailedExecutionInfo: TransactionDetails['detailedExecutionInfo']
}): TransactionDetails => ({
  safeAddress: 'sep:0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67',
  txId: 'multisig_0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415_0xcb83bc36cf4a2998e7fe222e36c458c59c3778f65b4e5bb361c29a73c2de62cc',
  txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
  txInfo,
  txData,
  detailedExecutionInfo,
})

// TODO: Replace with safeTxBuilder
export const createMockSafeTransaction = ({
  to,
  data,
  operation = OperationType.Call,
  value,
}: {
  to: string
  data: string
  operation?: OperationType
  value?: string
}): SafeTransaction => {
  return new EthSafeTransaction({
    to,
    data,
    operation,
    value: value || '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    nonce: 0,
    refundReceiver: ZERO_ADDRESS,
    safeTxGas: '0',
  })
}
