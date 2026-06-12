import { render } from '@/tests/test-utils'
import { screen, within, fireEvent, waitFor } from '@testing-library/react'
import TxSigners from './index'
import {
  transactionDetailsBuilder,
  multisigExecutionDetailsBuilder,
  multisigConfirmationBuilder,
  moduleExecutionDetailsBuilder,
} from '@/tests/builders/transactionDetails'
import { safeTxSummaryBuilder, executionInfoBuilder } from '@/tests/builders/safeTx'
import { addressExBuilder } from '@/tests/builders/safe'
import { mockSafeInfo, mockWallet, mockCurrentChain } from '@/tests/mocks/hooks'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
}))
jest.mock('@/hooks/useIsPending', () => jest.fn(() => false))
jest.mock('@/hooks/useTransactionStatus', () => jest.fn(() => 'Awaiting confirmations'))
jest.mock('@/hooks/useAddressBook', () => jest.fn(() => ({})))

const mockGetTransaction = jest.fn()
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({
  useWeb3ReadOnly: jest.fn(() => ({ getTransaction: mockGetTransaction })),
}))

// Avoid rendering nested share link wrapper logic
jest.mock('@/components/transactions/TxShareLink/TxShareLink', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}))

const ownerAddress = checksumAddress(faker.finance.ethereumAddress())

const buildConfirmations = (count: number, required: number) => {
  const signers = Array.from({ length: count }, () => addressExBuilder().build())
  const confirmations = signers.map((signer) => multisigConfirmationBuilder().with({ signer }).build())
  return { signers, confirmations, required }
}

describe('TxSigners (Audit Log)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTransaction.mockReset()
    mockSafeInfo({ threshold: 2, owners: [{ value: ownerAddress, name: null, logoUri: null }] })
    mockWallet({ address: ownerAddress })
    mockCurrentChain()
  })

  it('returns null for transactions without execution info or executedAt', () => {
    const txDetails = transactionDetailsBuilder().with({ detailedExecutionInfo: undefined, executedAt: null }).build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    const { container } = render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders the "AUDIT LOG" header', () => {
    const { confirmations } = buildConfirmations(1, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder()
      .with({
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
        executionInfo: executionInfoBuilder().with({ confirmationsSubmitted: 1, confirmationsRequired: 2 }).build(),
      })
      .build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.getByText('Audit log')).toBeInTheDocument()
  })

  it('displays the confirmation count chip', () => {
    const { confirmations } = buildConfirmations(2, 3)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 3 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder()
      .with({
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
        executionInfo: executionInfoBuilder().with({ confirmationsSubmitted: 2, confirmationsRequired: 3 }).build(),
      })
      .build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('shows "Created" label for owner-initiated transactions', () => {
    const { confirmations } = buildConfirmations(1, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.getByText('Created')).toBeInTheDocument()
  })

  it('shows "Proposed" label for proposer-initiated transactions', () => {
    const { confirmations } = buildConfirmations(1, 2)
    const proposerAddr = checksumAddress(faker.finance.ethereumAddress())
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={true} proposer={proposerAddr} />)

    expect(screen.getByText('Proposed')).toBeInTheDocument()
  })

  it('renders "Signed (N/M)" labels for each confirmation', () => {
    const { confirmations } = buildConfirmations(2, 3)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 3 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.getByText('Signed (1/3)')).toBeInTheDocument()
    expect(screen.getByText('Signed (2/3)')).toBeInTheDocument()
  })

  it('shows "Executed" label when executor is present', () => {
    const executor = addressExBuilder().build()
    const { confirmations } = buildConfirmations(2, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2, executor })
          .build(),
        txStatus: TransactionStatus.SUCCESS,
        executedAt: Date.now(),
        txHash: faker.string.hexadecimal({ length: 64 }),
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.getByText('Executed')).toBeInTheDocument()
  })

  it('shows info banner when below threshold', () => {
    const { confirmations } = buildConfirmations(1, 3)
    mockWallet(null) // No wallet connected so canExecute is false
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 3, executor: null })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.getByText('Can be executed once the threshold is reached.')).toBeInTheDocument()
  })

  it('shows proposer review banner when proposer-submitted and below threshold', () => {
    const { confirmations } = buildConfirmations(1, 3)
    mockWallet(null)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 3, executor: null })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(
      <TxSigners
        txDetails={txDetails}
        txSummary={txSummary}
        isTxFromProposer={true}
        proposer={checksumAddress(faker.finance.ethereumAddress())}
      />,
    )

    expect(
      screen.getByText('This transaction was created by a proposer. Please review and either confirm or reject it.'),
    ).toBeInTheDocument()
  })

  it('hides info banners once threshold is reached', () => {
    const { confirmations } = buildConfirmations(2, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2, executor: null })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.queryByText('Can be executed once the threshold is reached.')).not.toBeInTheDocument()
  })

  it('shows proposer banner even after threshold is reached but not executed', () => {
    const { confirmations } = buildConfirmations(2, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2, executor: null })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(
      <TxSigners
        txDetails={txDetails}
        txSummary={txSummary}
        isTxFromProposer={true}
        proposer={checksumAddress(faker.finance.ethereumAddress())}
      />,
    )

    expect(
      screen.getByText('This transaction was created by a proposer. Please review and either confirm or reject it.'),
    ).toBeInTheDocument()
    // Threshold alert should still be hidden since threshold is met
    expect(screen.queryByText('Can be executed once the threshold is reached.')).not.toBeInTheDocument()
  })

  it('shows alerts for the last signer who can execute', () => {
    const { confirmations } = buildConfirmations(1, 2)
    // Wallet is the last signer needed — canExecute would be true
    mockWallet({ address: ownerAddress })
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2, executor: null })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(
      <TxSigners
        txDetails={txDetails}
        txSummary={txSummary}
        isTxFromProposer={true}
        proposer={checksumAddress(faker.finance.ethereumAddress())}
      />,
    )

    expect(screen.getByText('Can be executed once the threshold is reached.')).toBeInTheDocument()
    expect(
      screen.getByText('This transaction was created by a proposer. Please review and either confirm or reject it.'),
    ).toBeInTheDocument()
  })

  it('shows disabled explorer button with tooltip for queued transactions', () => {
    const { confirmations } = buildConfirmations(1, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
        txHash: null,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    const actionsList = screen.getByTestId('transaction-actions-list')
    const disabledButtons = within(actionsList).getAllByRole('button')
    const disabledExplorerBtn = disabledButtons.find((btn) => btn.hasAttribute('disabled'))
    expect(disabledExplorerBtn).toBeInTheDocument()
  })

  it('uses consistent labels for cancellation transactions', () => {
    const { confirmations } = buildConfirmations(1, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        txInfo: {
          type: 'Custom' as const,
          to: addressExBuilder().build(),
          dataSize: '0',
          value: '0',
          isCancellation: true,
          methodName: null,
        },
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    // Cancellation uses same labels as normal transactions
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Signed (1/2)')).toBeInTheDocument()
  })

  it('copies the transaction hash to clipboard via the hash button', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } })

    const txHash = faker.string.hexadecimal({ length: 64 })
    const executor = addressExBuilder().build()
    const { confirmations } = buildConfirmations(2, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2, executor })
          .build(),
        txStatus: TransactionStatus.SUCCESS,
        executedAt: Date.now(),
        txHash,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    fireEvent.click(screen.getByTestId('copy-tx-hash-btn'))

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(txHash)
    })
  })

  it('disables the hash button when the transaction has no hash yet', () => {
    const { confirmations } = buildConfirmations(1, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
        txHash: null,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.queryByTestId('copy-tx-hash-btn')).not.toBeInTheDocument()
  })

  it('copies address to clipboard on click', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } })

    const { confirmations } = buildConfirmations(1, 2)
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations, confirmationsRequired: 2 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    const copyButtons = screen.getAllByRole('button', { name: /click to copy address/i })
    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(expect.any(String))
    })
  })

  it('resolves address book names for actors', () => {
    const namedAddress = checksumAddress(faker.finance.ethereumAddress())
    const mockUseAddressBook = jest.requireMock('@/hooks/useAddressBook') as jest.Mock
    mockUseAddressBook.mockReturnValue({ [namedAddress]: 'Alice' })

    const confirmation = multisigConfirmationBuilder()
      .with({ signer: { value: namedAddress, name: null, logoUri: null } })
      .build()
    const txDetails = transactionDetailsBuilder()
      .with({
        detailedExecutionInfo: multisigExecutionDetailsBuilder()
          .with({ confirmations: [confirmation], confirmationsRequired: 2 })
          .build(),
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      })
      .build()
    const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

    render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} proposer={ownerAddress} />)

    expect(screen.getByText(/Alice/)).toBeInTheDocument()
  })

  describe('Module-executed transactions', () => {
    const buildModuleTxDetails = (moduleOverrides = {}, txOverrides = {}) =>
      transactionDetailsBuilder()
        .with({
          detailedExecutionInfo: moduleExecutionDetailsBuilder()
            .with({
              address: {
                value: checksumAddress(faker.finance.ethereumAddress()),
                name: 'AllowanceModule',
                logoUri: null,
              },
              ...moduleOverrides,
            })
            .build(),
          txStatus: TransactionStatus.SUCCESS,
          executedAt: Date.now(),
          txHash: faker.string.hexadecimal({ length: 64 }),
          ...txOverrides,
        })
        .build()

    it('renders Created and Executed rows with initiator from on-chain lookup', async () => {
      const initiatorAddr = checksumAddress(faker.finance.ethereumAddress())
      mockGetTransaction.mockResolvedValue({ from: initiatorAddr })

      const txDetails = buildModuleTxDetails()
      const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()

      render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} />)

      expect(screen.getByText('Audit log')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Executed')).toBeInTheDocument()
      expect(screen.getByText(/Allowance Module/)).toBeInTheDocument()

      await waitFor(() => {
        expect(mockGetTransaction).toHaveBeenCalledWith(txDetails.txHash)
      })
    })

    it('shows dash for Created row when RPC lookup has not resolved', () => {
      mockGetTransaction.mockReturnValue(new Promise(() => {})) // never resolves

      const txDetails = buildModuleTxDetails()
      const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()

      render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} />)

      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('does not show confirmation chip for module transactions', () => {
      mockGetTransaction.mockResolvedValue({ from: checksumAddress(faker.finance.ethereumAddress()) })

      const txDetails = buildModuleTxDetails()
      const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()

      render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} />)

      expect(screen.queryByText(/\d\/\d/)).not.toBeInTheDocument()
    })
  })

  describe('Incoming/simple executed transactions', () => {
    it('renders audit log with Executed row for incoming transactions', () => {
      const txDetails = transactionDetailsBuilder()
        .with({
          detailedExecutionInfo: undefined,
          txStatus: TransactionStatus.SUCCESS,
          executedAt: Date.now(),
          txHash: faker.string.hexadecimal({ length: 64 }),
        })
        .build()
      const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()

      render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} />)

      expect(screen.getByText('Audit log')).toBeInTheDocument()
      expect(screen.getByText('Executed')).toBeInTheDocument()
      expect(screen.getByTestId('transaction-actions-list')).toBeInTheDocument()
    })

    it('returns null for transactions without executedAt', () => {
      const txDetails = transactionDetailsBuilder()
        .with({
          detailedExecutionInfo: undefined,
          executedAt: null,
          txHash: null,
        })
        .build()
      const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.AWAITING_CONFIRMATIONS }).build()

      const { container } = render(<TxSigners txDetails={txDetails} txSummary={txSummary} isTxFromProposer={false} />)

      expect(container.firstChild).toBeNull()
    })
  })
})
