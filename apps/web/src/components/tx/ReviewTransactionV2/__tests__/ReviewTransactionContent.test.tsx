import { safeTxBuilder } from '@/tests/builders/safeTx'
import { render } from '@/tests/test-utils'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { ReviewTransactionContent } from '../ReviewTransactionContent'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { defaultSecurityContextValues } from '@safe-global/utils/components/tx/security/shared/utils'
import { SlotProvider } from '@/components/tx-flow/slots'
import * as slotProvider from '@/components/tx-flow/slots'
import TxFlowProvider, { type TxFlowProviderProps } from '@/components/tx-flow/TxFlowProvider'

const txDetails = {
  safeAddress: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67',
  txId: 'multisig_0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67_0x938635afdeab5ab17b377896f10dbe161fcc44d488296bc0000b733623d57c80',
  executedAt: null,
  txStatus: 'AWAITING_EXECUTION',
  txInfo: {
    type: 'SettingsChange',
    humanDescription: 'Add new owner 0xd8dA...6045 with threshold 1',
    dataDecoded: {
      method: 'addOwnerWithThreshold',
      parameters: [
        {
          name: 'owner',
          type: 'address',
          value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          valueDecoded: null,
        },
        {
          name: '_threshold',
          type: 'uint256',
          value: '1',
          valueDecoded: null,
        },
      ],
    },
    settingsInfo: {
      type: 'ADD_OWNER',
      owner: {
        value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        name: null,
        logoUri: null,
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
          valueDecoded: null,
        },
        {
          name: '_threshold',
          type: 'uint256',
          value: '1',
          valueDecoded: null,
        },
      ],
    },
    to: {
      value: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67',
      name: 'SafeProxy',
      logoUri: null,
    },
    value: '0',
    operation: 0,
    trustedDelegateCallTarget: null,
    addressInfoIndex: null,
  },
  txHash: null,
  detailedExecutionInfo: {
    type: 'MULTISIG',
    submittedAt: 1726497729356,
    nonce: 8,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: {
      value: '0x0000000000000000000000000000000000000000',
      name: 'MetaMultiSigWallet',
      logoUri: null,
    },
    safeTxHash: '0x938635afdeab5ab17b377896f10dbe161fcc44d488296bc0000b733623d57c80',
    executor: null,
    signers: [
      {
        value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
        name: null,
        logoUri: null,
      },
    ],
    confirmationsRequired: 1,
    confirmations: [
      {
        signer: {
          value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
          name: null,
          logoUri: null,
        },
        signature:
          '0xd91721922d38384a4d40b20d923c49cefb56f60bfe0b357de11a4a044483d670075842d7bba26cf4aa84788ab0bd85137ad09c7f9cd84154db00d456b15e42dc1b',
        submittedAt: 1726497740521,
      },
    ],
    rejectors: [],
    gasTokenInfo: null,
    trusted: true,
    proposer: {
      value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
      name: null,
      logoUri: null,
    },
  },
  safeAppInfo: null,
} as unknown as TransactionDetails

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
}

const renderReviewTransactionContent = (
  props: Partial<Parameters<typeof ReviewTransactionContent>[0]> = {},
  txFlowProviderProps: Partial<TxFlowProviderProps<unknown>> = {},
) => {
  return render(
    <SlotProvider>
      <TxFlowProvider step={0} prevStep={() => {}} nextStep={() => {}} data={{}} {...txFlowProviderProps}>
        <ReviewTransactionContent {...defaultProps} {...props} />
      </TxFlowProvider>
    </SlotProvider>,
  )
}

describe('ReviewTransactionContent', () => {
  it('should display a safeTxError', () => {
    const { getByText } = renderReviewTransactionContent({
      txDetails,
      safeTxError: new Error('Safe transaction error'),
      safeTx: safeTxBuilder().build(),
    })

    expect(
      getByText('This transaction will most likely fail. To save gas costs, avoid confirming the transaction.'),
    ).toBeInTheDocument()
  })

  describe('New transaction', () => {
    describe('Batch', () => {
      const safe = extendedSafeInfoBuilder().build()
      const safeInfo = { safe, safeAddress: safe.address.value }

      beforeEach(() => {
        jest.spyOn(useSafeInfo, 'default').mockReturnValue(safeInfo as any)
      })

      it('Does not show Add to batch button if not registered', () => {
        jest.spyOn(slotProvider, 'useSlot').mockReturnValue([])

        const { queryByText } = renderReviewTransactionContent()

        const button = queryByText('Add to batch')

        expect(button).not.toBeInTheDocument()
      })

      it('Shows the Add to batch button if there registered for the "feature" slot', () => {
        jest
          .spyOn(slotProvider, 'useSlot')
          .mockImplementation((slotName) =>
            slotName === slotProvider.SlotName.Feature
              ? [{ Component: () => <button>Add to batch</button>, id: 'batching', label: 'Add to batch' }]
              : [],
          )

        const { getByText } = renderReviewTransactionContent()

        const button = getByText('Add to batch')

        expect(button).toBeInTheDocument()
      })
    })
  })

  it('should not display safeTxError message for valid transactions', () => {
    const { queryByText } = renderReviewTransactionContent({ txDetails })

    expect(
      queryByText('This transaction will most likely fail. To save gas costs, avoid confirming the transaction.'),
    ).not.toBeInTheDocument()
  })
})
