import * as hooks from '@/components/tx/SignOrExecuteForm/hooks'
import * as execThroughRoleHooks from '@/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { render } from '@/tests/test-utils'
import { fireEvent, waitFor } from '@testing-library/react'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { ReviewTransactionContent } from '../ReviewTransactionContent'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { defaultSecurityContextValues } from '@safe-global/utils/components/tx/security/shared/utils'

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

describe('ReviewTransactionContent', () => {
  it('should display a safeTxError', () => {
    const { getByText } = render(
      <ReviewTransactionContent
        {...defaultProps}
        txDetails={txDetails}
        safeTxError={new Error('Safe transaction error')}
        safeTx={safeTxBuilder().build()}
      />,
    )

    expect(
      getByText('This transaction will most likely fail. To save gas costs, avoid confirming the transaction.'),
    ).toBeInTheDocument()
  })

  describe('Existing transaction', () => {
    it('should display radio options to sign or execute if both are possible', () => {
      jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)

      const { getByText } = render(
        <ReviewTransactionContent {...defaultProps} txDetails={txDetails} isExecutable={true} />,
      )

      expect(getByText('Would you like to execute the transaction immediately?')).toBeInTheDocument()
    })
  })

  describe('New transaction', () => {
    it('should display radio options to sign or execute if both are possible', () => {
      jest.spyOn(hooks, 'useValidateNonce').mockReturnValueOnce(true)

      const { getByText } = render(
        <ReviewTransactionContent {...defaultProps} txDetails={txDetails} isExecutable={true} />,
      )

      expect(getByText('Would you like to execute the transaction immediately?')).toBeInTheDocument()
    })

    describe('Batch', () => {
      const safe = extendedSafeInfoBuilder().build()
      const safeInfo = { safe, safeAddress: safe.address.value }

      beforeEach(() => {
        jest.spyOn(useSafeInfo, 'default').mockReturnValue(safeInfo as any)
      })

      it('shows a batch button on tx creation', () => {
        const { getByText } = render(
          <ReviewTransactionContent {...defaultProps} txDetails={txDetails} onlyExecute={true} isCreation />,
        )

        expect(getByText('Add to batch')).toBeInTheDocument()
      })

      it('does not show a batch button when signing a batch', () => {
        const { queryByText } = render(
          <ReviewTransactionContent {...defaultProps} txDetails={txDetails} onlyExecute={true} isCreation isBatch />,
        )

        expect(queryByText('Add to batch')).not.toBeInTheDocument()
      })

      it('disables the batch button if tx is not batchable', () => {
        const { getByText } = render(
          <ReviewTransactionContent
            {...defaultProps}
            txDetails={txDetails}
            onlyExecute={true}
            isCreation
            isBatchable={false}
          />,
        )

        const batchButton = getByText('Add to batch')

        expect(batchButton).toBeInTheDocument()
        expect(batchButton).toBeDisabled()
      })

      it('submits a batch when the batch button is clicked', async () => {
        const mockAddToBatch = jest.fn()

        const { getByText } = render(
          <ReviewTransactionContent
            {...defaultProps}
            txDetails={txDetails}
            onlyExecute={true}
            isBatchable
            isCreation
            txActions={{ ...defaultProps.txActions, addToBatch: mockAddToBatch }}
          />,
        )

        const batchButton = getByText('Add to batch')

        fireEvent.click(batchButton)

        await waitFor(() => {
          expect(mockAddToBatch).toHaveBeenCalled()
        })
      })

      it('Hides the Add to batch button if there is an origin', () => {
        const { queryByText } = render(<ReviewTransactionContent {...defaultProps} origin="MockOrigin" />)

        const button = queryByText('Add to batch')

        expect(button).not.toBeInTheDocument()
      })

      it('Shows the Add to batch button if there is no origin and it is a creation', () => {
        const { getByText } = render(<ReviewTransactionContent {...defaultProps} origin={undefined} isCreation />)

        const button = getByText('Add to batch')

        expect(button).toBeInTheDocument()
      })
    })
  })

  it('should not display radio options if execution is the only option', () => {
    jest.spyOn(execThroughRoleHooks, 'useRoles').mockReturnValue([])

    const { queryByText } = render(
      <ReviewTransactionContent {...defaultProps} txDetails={txDetails} onlyExecute={true} />,
    )
    expect(queryByText('Would you like to execute the transaction immediately?')).not.toBeInTheDocument()
  })

  it('should display a sign/execute title if that option is selected', () => {
    jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)

    const { getByTestId, getByText } = render(
      <ReviewTransactionContent {...defaultProps} txDetails={txDetails} isExecutable={true} />,
    )

    expect(getByText('Would you like to execute the transaction immediately?')).toBeInTheDocument()

    const executeCheckbox = getByTestId('execute-checkbox')
    const signCheckbox = getByTestId('sign-checkbox')

    expect(getByText("You're about to execute this transaction.")).toBeInTheDocument()

    fireEvent.click(signCheckbox)

    expect(getByText("You're about to confirm this transaction.")).toBeInTheDocument()

    fireEvent.click(executeCheckbox)

    expect(getByText("You're about to execute this transaction.")).toBeInTheDocument()
  })

  it('should not display safeTxError message for valid transactions', () => {
    const { queryByText } = render(<ReviewTransactionContent {...defaultProps} txDetails={txDetails} />)

    expect(
      queryByText('This transaction will most likely fail. To save gas costs, avoid confirming the transaction.'),
    ).not.toBeInTheDocument()
  })
})
