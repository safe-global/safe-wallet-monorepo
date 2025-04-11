import { safeTxBuilder } from '@/tests/builders/safeTx'
import { render as renderTestUtils } from '@/tests/test-utils'
import { within } from '@testing-library/react'
import {
  DetailedExecutionInfoType,
  SettingsInfoType,
  TransactionInfoType,
} from '@safe-global/safe-gateway-typescript-sdk'
import { ReviewTransactionContent } from '../ReviewTransactionContent'
import { defaultSecurityContextValues } from '@safe-global/utils/components/tx/security/shared/utils'
import * as slots from '@/components/tx-flow/slots'
import { initialContext, TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { createMockTransactionDetails } from '@/tests/transactions'

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
  },
})

const defaultProps = {
  onSubmit: jest.fn(),
  txId: '0x01231',
  isOwner: true,
  txActions: {
    proposeTx: jest.fn(),
    signTx: jest.fn(),
    addToBatch: jest.fn(),
    executeTx: jest.fn(),
    signProposerTx: jest.fn(),
  },
  txSecurity: defaultSecurityContextValues,
  safeTxError: undefined,
  safeTx: safeTxBuilder().build(),
  txDetails,
}

const render = (
  props: Partial<Parameters<typeof ReviewTransactionContent>[0]> = {},
  txFlowContext: Partial<TxFlowContextType> = {},
) => {
  return renderTestUtils(
    <slots.SlotProvider>
      <TxFlowContext.Provider value={{ ...initialContext, ...txFlowContext }}>
        <ReviewTransactionContent {...defaultProps} {...props} />
      </TxFlowContext.Provider>
    </slots.SlotProvider>,
  )
}

describe('ReviewTransactionContent', () => {
  const slotComponentSpy = jest.spyOn(slots, 'Slot')

  beforeEach(() => {
    jest.clearAllMocks()
    slotComponentSpy.mockImplementation(({ name, children }) => <div data-testid={`slot-${name}`}>{children}</div>)
  })

  it('should render Feature slot', () => {
    const { getByTestId } = render()

    expect(getByTestId(`slot-${slots.SlotName.Feature}`)).toBeInTheDocument()
  })

  it('should render Footer slot', () => {
    const { getByTestId } = render()

    expect(getByTestId(`slot-${slots.SlotName.Footer}`)).toBeInTheDocument()
  })

  it('should render Submit slot', () => {
    const { getByTestId } = render()

    expect(getByTestId(`slot-${slots.SlotName.Submit}`)).toBeInTheDocument()
  })

  it('should render Sign button as fallback for submit slot', () => {
    const { getByTestId } = render()

    const submitSlot = getByTestId(`slot-${slots.SlotName.Submit}`)
    expect(within(submitSlot).getByTestId('combo-submit-sign')).toBeInTheDocument()
  })

  describe('should display the correct title', () => {
    it('when transaction will be signed', () => {
      const { getByText } = render()

      expect(getByText("You're about to confirm this transaction.")).toBeInTheDocument()
    })

    it('when transaction will be executed', () => {
      const { getByText } = render(undefined, { willExecute: true })

      expect(getByText("You're about to execute this transaction.")).toBeInTheDocument()
    })

    it('when transaction will be proposed', () => {
      const { getByText } = render(undefined, { isProposing: true })

      expect(getByText("You're about to propose this transaction.")).toBeInTheDocument()
    })
  })

  it('should display a safeTxError', () => {
    const { getByText } = render({
      safeTxError: new Error('Safe transaction error'),
      safeTx: safeTxBuilder().build(),
    })

    expect(
      getByText('This transaction will most likely fail. To save gas costs, avoid confirming the transaction.'),
    ).toBeInTheDocument()
  })

  it('should not display safeTxError message for valid transactions', () => {
    const { queryByText } = render()

    expect(
      queryByText('This transaction will most likely fail. To save gas costs, avoid confirming the transaction.'),
    ).not.toBeInTheDocument()
  })
})
