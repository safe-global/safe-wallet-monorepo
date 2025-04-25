import { safeTxBuilder } from '@/tests/builders/safeTx'
import ConfirmationView from './index'
import { render } from '@/tests/test-utils'
import { createMockTransactionDetails } from '@/tests/transactions'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import {
  DetailedExecutionInfoType,
  SettingsInfoType,
  TransactionInfoType,
} from '@safe-global/safe-gateway-typescript-sdk'

const txDetails = createMockTransactionDetails({
  txInfo: {
    type: TransactionInfoType.SETTINGS_CHANGE,
    humanDescription: 'Add new owner 0xd8dA...6045 with threshold 1',
    dataDecoded: {
      method: 'addOwnerWithThreshold',
      parameters: [
        {
          name: 'owner',
          type: 'address',
          value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        {
          name: '_threshold',
          type: 'uint256',
          value: '1',
        },
      ],
    },
    settingsInfo: {
      type: SettingsInfoType.ADD_OWNER,
      owner: {
        value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        name: 'Nevinha',
        logoUri: 'http://something.com',
      },
      threshold: 1,
    },
  },
  txData: {
    hexData:
      '0x0d582f13000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001',
    dataDecoded: {
      method: 'addOwnerWithThreshold',
      parameters: [
        {
          name: 'owner',
          type: 'address',
          value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        {
          name: '_threshold',
          type: 'uint256',
          value: '1',
        },
      ],
    },
    to: {
      value: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67',
      name: '',
    },
    value: '0',
    operation: 0,
    trustedDelegateCallTarget: false,
    addressInfoIndex: {
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': {
        value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        name: 'MetaMultiSigWallet',
      },
    },
  },
  detailedExecutionInfo: {
    type: DetailedExecutionInfoType.MULTISIG,
    submittedAt: 1726064794013,
    nonce: 4,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: {
      value: '0x0000000000000000000000000000000000000000',
      name: 'MetaMultiSigWallet',
    },
    safeTxHash: '0x96a96c11b8d013ff5d7a6ce960b22e961046cfa42eff422ac71c1daf6adef2e0',
    signers: [
      {
        value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
        name: '',
      },
    ],
    confirmationsRequired: 1,
    confirmations: [],
    rejectors: [],
    trusted: false,
    proposer: {
      value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
      name: '',
    },
    proposedByDelegate: null,
  },
})
const safeTx = safeTxBuilder().build()
const safeTxWithNativeData = {
  ...safeTx,
  data: {
    ...safeTx.data,
    refundReceiver: '0x79964FA459D36EbFfc2a2cA66321B689F6E4aC52',
    to: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
    data: '0x',
  },
}
xdescribe('ConfirmationView', () => {
  it('should display a confirmation screen for a SETTINGS_CHANGE transaction', () => {
    const { container } = render(<ConfirmationView safeTx={safeTxWithNativeData} txDetails={txDetails} isApproval />)

    expect(container).toMatchSnapshot()
  })

  it("should display a confirmation with method call when the transaction type is not found in the ConfirmationView's mapper", () => {
    const CustomTxDetails = { ...txDetails, txInfo: { ...txDetails.txInfo, type: TransactionInfoType.CUSTOM } }

    const { container } = render(
      <ConfirmationView safeTx={safeTxWithNativeData} txDetails={CustomTxDetails as TransactionDetails} isApproval />,
    )

    expect(container).toMatchSnapshot()
  })
})
