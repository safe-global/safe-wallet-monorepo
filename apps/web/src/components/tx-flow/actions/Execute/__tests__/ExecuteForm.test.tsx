import type { Relay } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import { type ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { ExecuteForm } from '../ExecuteForm'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'
import { QuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import type { GasPaymentOptions } from '@/hooks/useGasPaymentOptions'
import type { SponsoredOffer } from '@/utils/gasPayment'
import * as useGasLimit from '@/hooks/useGasLimit'
import * as useIsValidExecution from '@/hooks/useIsValidExecution'
import * as walletCanPay from '@/hooks/useWalletCanPay'
import * as useValidateTxData from '@/hooks/useValidateTxData'
import { render } from '@/tests/test-utils'
import { fireEvent, waitFor } from '@testing-library/react'
import type {
  RecipientAnalysisResults,
  ContractAnalysisResults,
  DeadlockAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { TxModalContext } from '@/components/tx-flow'
import { SuccessScreenFlow } from '@/components/tx-flow/flows'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'

const mockUseGasPaymentOptions = jest.fn<GasPaymentOptions, []>()
jest.mock('@/hooks/useGasPaymentOptions', () => ({
  useGasPaymentOptions: () => mockUseGasPaymentOptions(),
}))

type SelectorStubProps = { offer: SponsoredOffer | null; showsProUpsell?: boolean }
jest.mock('@/components/tx/ExecutionMethodSelector', () => ({
  ExecutionMethod: { RELAY: 'RELAY', WALLET: 'WALLET' },
  ExecutionMethodSelector: (props: SelectorStubProps) => (
    <div
      data-testid="execution-method-selector"
      data-offer={JSON.stringify(props.offer)}
      data-upsell={String(props.showsProUpsell)}
    />
  ),
}))

const SPACE_ID = faker.string.uuid()
const dailyOffer: SponsoredOffer = {
  option: 'FREE_DAILY_LIMIT',
  disabledReason: null,
  relays: { remaining: 3, limit: 5 },
}
const subscriptionOffer: SponsoredOffer = {
  option: 'SUBSCRIPTION',
  disabledReason: null,
  spaceId: SPACE_ID,
  left: 10,
  meter: { used: 40, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' },
}
const exhaustedSubscriptionOffer: SponsoredOffer = {
  ...subscriptionOffer,
  disabledReason: 'LIMIT_REACHED',
  left: 0,
  meter: { used: 50, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' },
}

const mockExclude = jest.fn()
const gasPaymentOptions = (overrides: Partial<GasPaymentOptions> = {}): GasPaymentOptions => ({
  offer: null,
  showsProUpsell: false,
  exclude: mockExclude,
  ...overrides,
})

// We assume that CheckWallet always returns true
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

jest.mock('@/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
const mockUseSafeScope = useSafeScope as jest.MockedFunction<typeof useSafeScope>

describe('ExecuteForm', () => {
  const safeTransaction = createMockSafeTransaction({
    to: '0x1',
    data: '0x',
    operation: OperationType.Call,
  })

  const defaultProps = {
    onSubmit: jest.fn(),
    isOwner: true,
    txId: '0x123123',
    isExecutionLoop: false,
    relays: [undefined, undefined, false] as AsyncResult<Relay>,
    txActions: {
      proposeTx: jest.fn(),
      signTx: jest.fn(),
      addToBatch: jest.fn(),
      executeTx: jest.fn(),
      signProposerTx: jest.fn(),
    },
    txSecurity: {
      setRecipientAddresses: jest.fn(),
      setPoisoningAddresses: jest.fn(),
      setSafeTx: jest.fn(),
      recipient: [undefined, undefined, false] as AsyncResult<RecipientAnalysisResults>,
      contract: [undefined, undefined, false] as AsyncResult<ContractAnalysisResults>,
      threat: [undefined, undefined, false] as AsyncResult<ThreatAnalysisResults>,
      deadlock: [undefined, undefined, false] as AsyncResult<DeadlockAnalysisResults>,
      nestedThreat: [undefined, undefined, false] as AsyncResult<ThreatAnalysisResults>,
      isNested: false,
      needsRiskConfirmation: false,
      isRiskConfirmed: false,
      setIsRiskConfirmed: jest.fn(),
      safeAnalysis: null,
      addToTrustedList: jest.fn(),
      hasProFeatures: true,
      isSafePro: true,
    },
    options: [
      { id: 'execute', label: 'Execute' },
      { id: 'sign', label: 'Sign' },
    ],
    onChange: jest.fn(),
    slotId: 'execute',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions())
    jest.spyOn(walletCanPay, 'default').mockReturnValue(true)

    jest.spyOn(useValidateTxData, 'useValidateTxData').mockReturnValue([undefined, undefined, false])
    mockUseSafeScope.mockReturnValue(undefined)
  })

  it('shows estimated fees', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(getByText('Estimated fee')).toBeInTheDocument()
  })

  it('shows a non-owner error if the transaction still needs signatures and its not an owner', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isOwner={false} onlyExecute={false} />)

    expect(
      getByText("You are currently not a signer of this Safe account and won't be able to submit this transaction."),
    ).toBeInTheDocument()
  })

  it('does not show a non-owner error if the transaction is fully signed and its not an owner', () => {
    const { queryByText } = render(<ExecuteForm {...defaultProps} isOwner={false} onlyExecute={true} />)

    expect(
      queryByText("You are currently not a signer of this Safe account and won't be able to submit this transaction."),
    ).not.toBeInTheDocument()
  })

  it('shows an error if the same safe tries to execute', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isExecutionLoop={true} />)

    expect(
      getByText('Cannot execute a transaction from the Safe account itself, please connect a different account.'),
    ).toBeInTheDocument()
  })

  it('shows an error if the connected wallet has insufficient funds and no sponsored option is offered', () => {
    jest.spyOn(walletCanPay, 'default').mockReturnValue(false)

    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(
      getByText("Your connected wallet doesn't have enough funds to execute this transaction."),
    ).toBeInTheDocument()
  })

  it('hides the insufficient funds error while a sponsored option is selected', () => {
    jest.spyOn(walletCanPay, 'default').mockReturnValue(false)
    mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ offer: dailyOffer }))

    const { queryByText } = render(<ExecuteForm {...defaultProps} />)

    expect(
      queryByText("Your connected wallet doesn't have enough funds to execute this transaction."),
    ).not.toBeInTheDocument()
  })

  it('renders the selector and relays through the chain route for a daily offer', async () => {
    mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ offer: dailyOffer }))
    const mockExecuteTx = jest.fn()

    const { getByText, getByTestId } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
      />,
    )

    expect(getByTestId('execution-method-selector')).toHaveAttribute('data-offer', JSON.stringify(dailyOffer))
    fireEvent.click(getByText('Execute'))

    await waitFor(() => {
      expect(mockExecuteTx).toHaveBeenCalledWith(
        expect.anything(),
        safeTransaction,
        defaultProps.txId,
        undefined,
        true,
        false,
        null,
      )
    })
  })

  it('relays through the Workspace for a subscription offer', async () => {
    mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ offer: subscriptionOffer }))
    const mockExecuteTx = jest.fn()

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
      />,
    )

    fireEvent.click(getByText('Execute'))

    await waitFor(() => {
      expect(mockExecuteTx).toHaveBeenCalledWith(
        expect.anything(),
        safeTransaction,
        defaultProps.txId,
        undefined,
        true,
        false,
        SPACE_ID,
      )
    })
  })

  it('keeps the selector on screen and executes through the wallet when the subscription is exhausted', async () => {
    mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ offer: exhaustedSubscriptionOffer }))
    const mockExecuteTx = jest.fn()

    const { getByText, getByTestId } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
      />,
    )

    expect(getByTestId('execution-method-selector')).toHaveAttribute(
      'data-offer',
      JSON.stringify(exhaustedSubscriptionOffer),
    )
    expect(getByText('Execute')).toBeEnabled()
    fireEvent.click(getByText('Execute'))

    await waitFor(() => {
      expect(mockExecuteTx).toHaveBeenCalledWith(
        expect.anything(),
        safeTransaction,
        defaultProps.txId,
        undefined,
        false,
        false,
        null,
      )
    })
  })

  it('renders the selector for the Pro upsell when nothing is offered', () => {
    mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ showsProUpsell: true }))

    const { getByTestId } = render(<ExecuteForm {...defaultProps} />)

    expect(getByTestId('execution-method-selector')).toHaveAttribute('data-offer', 'null')
    expect(getByTestId('execution-method-selector')).toHaveAttribute('data-upsell', 'true')
  })

  it('hides the selector and executes through the wallet while no offer is on offer yet', async () => {
    mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ offer: null, showsProUpsell: false }))
    const mockExecuteTx = jest.fn()

    const { getByText, queryByTestId } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
      />,
    )

    expect(queryByTestId('execution-method-selector')).not.toBeInTheDocument()
    expect(getByText('Execute')).toBeEnabled()
    fireEvent.click(getByText('Execute'))

    await waitFor(() => {
      expect(mockExecuteTx).toHaveBeenCalledWith(
        expect.anything(),
        safeTransaction,
        defaultProps.txId,
        undefined,
        false,
        false,
        null,
      )
    })
  })

  it('publishes the gas payer to the tx flow and clears it on unmount', () => {
    const setGasPaymentOption = jest.fn()
    mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ offer: dailyOffer }))

    const { unmount } = render(
      <TxFlowContext.Provider value={{ ...initialContext, setGasPaymentOption }}>
        <ExecuteForm {...defaultProps} safeTx={safeTransaction} />
      </TxFlowContext.Provider>,
    )

    expect(setGasPaymentOption).toHaveBeenLastCalledWith('FREE_DAILY_LIMIT')
    unmount()
    expect(setGasPaymentOption).toHaveBeenLastCalledWith(undefined)
  })

  it('shows an execution validation error', () => {
    jest
      .spyOn(useIsValidExecution, 'default')
      .mockReturnValue({ executionValidationError: new Error('Some error'), isValidExecutionLoading: false })

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        txActions={{
          proposeTx: jest.fn(),
          signTx: jest.fn(),
          addToBatch: jest.fn(),
          executeTx: jest.fn(),
          signProposerTx: jest.fn(),
        }}
      />,
    )

    expect(getByText(/Could not check this transaction/)).toBeInTheDocument()
  })

  it('shows a gasLimit error', () => {
    jest
      .spyOn(useGasLimit, 'default')
      .mockReturnValue({ gasLimitError: new Error('Gas limit error'), gasLimitLoading: false })

    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(getByText(/Could not check this transaction/)).toBeInTheDocument()
  })

  it('execute the tx when the submit button is clicked', async () => {
    const mockExecuteTx = jest.fn()

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{
          proposeTx: jest.fn(),
          signTx: jest.fn(),
          addToBatch: jest.fn(),
          executeTx: mockExecuteTx,
          signProposerTx: jest.fn(),
        }}
      />,
    )

    const button = getByText('Execute')

    fireEvent.click(button)

    await waitFor(() => {
      expect(mockExecuteTx).toHaveBeenCalled()
    })
  })

  describe('success screen scope', () => {
    const renderWithModal = () => {
      const setTxFlow = jest.fn()
      const mockExecuteTx = jest.fn().mockResolvedValue('0xexecuted')
      const view = render(
        <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
          <ExecuteForm
            {...defaultProps}
            safeTx={safeTransaction}
            txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
          />
        </TxModalContext.Provider>,
      )
      return { ...view, setTxFlow, mockExecuteTx }
    }

    it('hands the selected Safe to the success screen when a Space-level scope is active', async () => {
      mockUseSafeScope.mockReturnValue({
        chainId: '11155111',
        safeAddress: '0x0000000000000000000000000000000000000001',
        scopeKey: '11155111:0x0000000000000000000000000000000000000001',
        safeLoaded: true,
        safeLoading: false,
      })
      const { getByText, setTxFlow, mockExecuteTx } = renderWithModal()

      fireEvent.click(getByText('Execute'))

      await waitFor(() => expect(mockExecuteTx).toHaveBeenCalled())
      await waitFor(() => expect(setTxFlow).toHaveBeenCalled())
      const [element] = setTxFlow.mock.calls[0]
      expect(element.type).toBe(SuccessScreenFlow)
      expect(element.props).toEqual({
        txId: '0xexecuted',
        scope: { chainId: '11155111', safeAddress: '0x0000000000000000000000000000000000000001' },
      })
    })

    it('opens the success screen without a scope on a Safe-level route', async () => {
      mockUseSafeScope.mockReturnValue(undefined)
      const { getByText, setTxFlow, mockExecuteTx } = renderWithModal()

      fireEvent.click(getByText('Execute'))

      await waitFor(() => expect(mockExecuteTx).toHaveBeenCalled())
      await waitFor(() => expect(setTxFlow).toHaveBeenCalled())
      expect(setTxFlow.mock.calls[0][0].props).toEqual({ txId: '0xexecuted', scope: undefined })
    })
  })

  it('shows a disabled submit button if there is no safeTx', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} safeTx={undefined} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if passed via props', () => {
    const { getByText } = render(<ExecuteForm safeTx={safeTransaction} disableSubmit {...defaultProps} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if the same safe is connected', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isExecutionLoop={true} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if there is a high or critical risk and user has not confirmed it', () => {
    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultProps.txSecurity, isRiskConfirmed: false, needsRiskConfirmation: true }}
      />,
    )

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows an enabled submit button if there is a high or critical risk and user has confirmed it', () => {
    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultProps.txSecurity, isRiskConfirmed: true, needsRiskConfirmation: true }}
      />,
    )

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('blocks execution and shows the simulation-failed banner on SIMULATION_FAILED', async () => {
    const mockExecuteTx = jest.fn().mockRejectedValue(new RelaySimulationError('SIMULATION_FAILED', 'expected revert'))

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
      />,
    )

    fireEvent.click(getByText('Execute'))

    await waitFor(() => {
      expect(getByText(/expected to fail on-chain/i)).toBeInTheDocument()
    })
    // The doomed tx can no longer be submitted.
    expect(getByText('Execute')).toBeDisabled()
  })

  describe('gas payment refusals', () => {
    it('excludes the refused option and explains the refusal', async () => {
      mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ offer: subscriptionOffer }))
      const mockExecuteTx = jest
        .fn()
        .mockRejectedValue(
          new QuotaExceededError('sponsored_transactions', 50, 50, '2026-11-01T00:00:00.000Z', 'Quota exceeded'),
        )

      const { getByText } = render(
        <ExecuteForm
          {...defaultProps}
          safeTx={safeTransaction}
          txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
        />,
      )
      fireEvent.click(getByText('Execute'))

      await waitFor(() => {
        expect(
          getByText(
            'Your Workspace has used all 50 sponsored transactions of this cycle until Nov 1, 2026. Pay the gas with your connected wallet instead.',
          ),
        ).toBeInTheDocument()
      })
      expect(mockExclude).toHaveBeenCalledWith(['SUBSCRIPTION'])
      expect(mockExecuteTx).toHaveBeenCalledTimes(1)
      expect(getByText('Execute')).toBeEnabled()
    })

    it('reports any other error as a submit error', async () => {
      const setSubmitError = jest.fn()
      mockUseGasPaymentOptions.mockReturnValue(gasPaymentOptions({ offer: dailyOffer }))
      const error = new Error('Something broke')
      const mockExecuteTx = jest.fn().mockRejectedValue(error)

      const { getByText } = render(
        <TxFlowContext.Provider value={{ ...initialContext, setSubmitError }}>
          <ExecuteForm
            {...defaultProps}
            safeTx={safeTransaction}
            txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
          />
        </TxFlowContext.Provider>,
      )
      fireEvent.click(getByText('Execute'))

      await waitFor(() => expect(setSubmitError).toHaveBeenCalledWith(error))
      expect(mockExclude).not.toHaveBeenCalled()
    })
  })

  it('offers an "Execute anyway" retry with acceptUnverifiedSimulation on INDETERMINATE_SIMULATION', async () => {
    const mockExecuteTx = jest
      .fn()
      .mockRejectedValueOnce(new RelaySimulationError('INDETERMINATE_SIMULATION', 'service down'))
      .mockResolvedValueOnce('0xnewtx')

    const { getByText, getByTestId } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{ ...defaultProps.txActions, executeTx: mockExecuteTx }}
      />,
    )

    fireEvent.click(getByText('Execute'))

    await waitFor(() => {
      expect(getByText(/couldn't review this transaction/i)).toBeInTheDocument()
    })

    // First attempt didn't opt into the unverified relay.
    expect(mockExecuteTx).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      undefined,
      expect.anything(),
      false,
      null,
    )

    fireEvent.click(getByTestId('relay-accept-unverified-btn'))

    await waitFor(() => {
      // Retry forwards acceptUnverifiedSimulation = true.
      expect(mockExecuteTx).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        undefined,
        expect.anything(),
        true,
        null,
      )
    })
  })
})
