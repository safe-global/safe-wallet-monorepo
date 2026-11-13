import type { ComponentProps } from 'react'
import { faker } from '@faker-js/faker'
import type {
  MultisigExecutionDetails,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import {
  AttestationVerificationStatus,
  CheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { attestedEvent, buildBenignSnapshot, buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import useAddressBook from '@/hooks/useAddressBook'
import { useChain, useHasFeature } from '@/hooks/useChains'
import { addressExBuilder } from '@/tests/builders/safe'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import {
  moduleExecutionDetailsBuilder,
  multisigConfirmationBuilder,
  multisigExecutionDetailsBuilder,
  transactionDetailsBuilder,
} from '@/tests/builders/transactionDetails'
import { mockCurrentChain, mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import { act, fakerChecksummedAddress, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import TxSigners from './index'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
  useChain: jest.fn(),
}))
jest.mock('@/hooks/useIsPending', () => jest.fn(() => false))
jest.mock('@/hooks/useTransactionStatus', () => jest.fn(() => 'Awaiting confirmations'))
jest.mock('@/hooks/useAddressBook', () => jest.fn())

const mockGetTransaction = jest.fn()
const mockStableReadOnlyProvider = { getTransaction: mockGetTransaction }
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({
  useWeb3ReadOnly: jest.fn(() => mockStableReadOnlyProvider),
}))

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

jest.mock('@/components/transactions/TxShareLink/TxShareLink', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}))

const mockUseAddressBook = jest.mocked(useAddressBook)
const mockUseHasFeature = jest.mocked(useHasFeature)
const mockUseChain = jest.mocked(useChain)
const mockUseSafenetCheck = jest.mocked(useSafenetCheck)

const ownerAddress = fakerChecksummedAddress()
const THRESHOLD_ALERT = 'Can be executed once the threshold is reached.'
const PROPOSER_ALERT = 'This transaction was created by a proposer. Please review and either confirm or reject it.'
const EXPIRED_WARNING = 'This order has expired. Reject this transaction and try again.'

const confirmationsBy = (count: number) =>
  Array.from({ length: count }, () =>
    multisigConfirmationBuilder().with({ signer: addressExBuilder().build() }).build(),
  )

const queuedTx = (
  signatures: number,
  threshold: number,
  details: Partial<MultisigExecutionDetails> = {},
  tx: Partial<TransactionDetails> = {},
): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      detailedExecutionInfo: multisigExecutionDetailsBuilder()
        .with({ confirmations: confirmationsBy(signatures), confirmationsRequired: threshold, ...details })
        .build(),
      txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      ...tx,
    })
    .build()

const executedTx = (signatures: number, threshold: number, txHash = faker.string.hexadecimal({ length: 64 })) =>
  transactionDetailsBuilder()
    .with({
      detailedExecutionInfo: multisigExecutionDetailsBuilder()
        .with({
          confirmations: confirmationsBy(signatures),
          confirmationsRequired: threshold,
          executor: addressExBuilder().build(),
        })
        .build(),
      txStatus: TransactionStatus.SUCCESS,
      executedAt: faker.date.recent().getTime(),
      txHash,
    })
    .build()

const oneSignatureShortSummary = (safeNonce: number, missingSigner: string) =>
  safeTxSummaryBuilder()
    .with({
      txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      executionInfo: executionInfoBuilder()
        .with({
          nonce: safeNonce,
          confirmationsSubmitted: 1,
          confirmationsRequired: 2,
          missingSigners: [{ value: missingSigner }],
        })
        .build(),
    })
    .build()

const renderTxSigners = (txDetails: TransactionDetails, props: Partial<ComponentProps<typeof TxSigners>> = {}) =>
  renderWithUserEvent(
    <TxSigners
      txDetails={txDetails}
      txSummary={safeTxSummaryBuilder().with({ txStatus: txDetails.txStatus }).build()}
      isTxFromProposer={false}
      proposer={ownerAddress}
      {...props}
    />,
  )

const spyOnClipboard = () => jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

describe('TxSigners (Audit Log)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTransaction.mockReset()
    mockUseAddressBook.mockReturnValue({})
    mockUseHasFeature.mockReturnValue(false)
    mockUseChain.mockReturnValue(undefined)
    mockUseSafenetCheck.mockReturnValue(buildCheckView())
    mockSafeInfo({ threshold: 2, owners: [{ value: ownerAddress, name: null, logoUri: null }] })
    mockWallet({ address: ownerAddress })
    mockCurrentChain()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns null for transactions without execution info or executedAt', () => {
    const txDetails = transactionDetailsBuilder().with({ detailedExecutionInfo: undefined, executedAt: null }).build()

    const { container } = renderTxSigners(txDetails)

    expect(container.firstChild).toBeNull()
  })

  it('renders the "AUDIT LOG" header', () => {
    renderTxSigners(queuedTx(1, 2))

    expect(screen.getByText('Audit log')).toBeInTheDocument()
  })

  it('displays the confirmation count chip', () => {
    renderTxSigners(queuedTx(2, 3))

    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('shows "Created" label for owner-initiated transactions', () => {
    renderTxSigners(queuedTx(1, 2), { isTxFromProposer: false })

    expect(screen.getByText('Created')).toBeInTheDocument()
  })

  it('shows "Proposed" label for proposer-initiated transactions', () => {
    renderTxSigners(queuedTx(1, 2), { isTxFromProposer: true, proposer: fakerChecksummedAddress() })

    expect(screen.getByText('Proposed')).toBeInTheDocument()
  })

  describe('the name of the proposer', () => {
    const proposerAddr = fakerChecksummedAddress()

    const renderProposedTx = (proposedByDelegateName: string | null) =>
      renderTxSigners(
        queuedTx(0, 2, {
          proposer: { value: proposerAddr, name: null, logoUri: null },
          proposedByDelegate: { value: proposerAddr, name: proposedByDelegateName, logoUri: null },
        }),
        { isTxFromProposer: true, proposer: proposerAddr },
      )

    it('shows the name that the local address book gives the proposer', () => {
      mockUseAddressBook.mockReturnValue({ [proposerAddr]: 'Treasury proposer' })

      renderProposedTx('Name from the API')

      expect(screen.getByText('By Treasury proposer')).toBeInTheDocument()
      expect(screen.queryByText('By Name from the API')).not.toBeInTheDocument()
    })

    it('falls back to the name that the gateway gives the delegate proposer', () => {
      renderProposedTx('Name from the API')

      expect(screen.getByText('By Name from the API')).toBeInTheDocument()
    })
  })

  it('renders "Signed (N/M)" labels for each confirmation', () => {
    renderTxSigners(queuedTx(2, 3))

    expect(screen.getByText('Signed (1/3)')).toBeInTheDocument()
    expect(screen.getByText('Signed (2/3)')).toBeInTheDocument()
  })

  it('shows "Executed" label when executor is present', () => {
    renderTxSigners(executedTx(2, 2))

    expect(screen.getByText('Executed')).toBeInTheDocument()
  })

  it('shows info banner when below threshold', () => {
    renderTxSigners(queuedTx(1, 3))

    const alert = screen.getByText(THRESHOLD_ALERT).closest('[role="alert"]')
    expect(alert).toHaveClass('bg-[var(--color-info-background)]')
    expect(alert?.querySelector('svg.lucide-info')).toBeTruthy()
  })

  it('shows proposer review banner when proposer-submitted and below threshold', () => {
    renderTxSigners(queuedTx(1, 3), { isTxFromProposer: true, proposer: fakerChecksummedAddress() })

    expect(screen.getByText(PROPOSER_ALERT)).toBeInTheDocument()
  })

  it('hides info banners once threshold is reached', () => {
    renderTxSigners(queuedTx(2, 2))

    expect(screen.queryByText(THRESHOLD_ALERT)).not.toBeInTheDocument()
  })

  it('shows the expired warning for a queued expired order', () => {
    renderTxSigners(queuedTx(1, 2), { isExpired: true })

    expect(screen.getByText(EXPIRED_WARNING)).toBeInTheDocument()
  })

  it('hides the expired warning once the transaction has been executed', () => {
    renderTxSigners(executedTx(2, 2), { isExpired: true })

    expect(screen.queryByText(EXPIRED_WARNING)).not.toBeInTheDocument()
  })

  it('shows proposer banner but no threshold banner once threshold is reached but not executed', () => {
    renderTxSigners(queuedTx(2, 2), { isTxFromProposer: true, proposer: fakerChecksummedAddress() })

    expect(screen.getByText(PROPOSER_ALERT)).toBeInTheDocument()
    expect(screen.queryByText(THRESHOLD_ALERT)).not.toBeInTheDocument()
  })

  it('keeps both banners for a connected owner whose signature would make the transaction executable', () => {
    const safe = mockSafeInfo({ threshold: 2, owners: [{ value: ownerAddress, name: null, logoUri: null }] })
    mockWallet({ address: ownerAddress })

    renderTxSigners(queuedTx(1, 2), {
      txSummary: oneSignatureShortSummary(safe.nonce, ownerAddress),
      isTxFromProposer: true,
      proposer: fakerChecksummedAddress(),
    })

    expect(screen.getByText(THRESHOLD_ALERT)).toBeInTheDocument()
    expect(screen.getByText(PROPOSER_ALERT)).toBeInTheDocument()
  })

  it('shows the pending execution step to a connected owner whose signature would make the transaction executable', () => {
    const safe = mockSafeInfo({ threshold: 2, owners: [{ value: ownerAddress, name: null, logoUri: null }] })
    mockWallet({ address: ownerAddress })

    renderTxSigners(queuedTx(1, 2), { txSummary: oneSignatureShortSummary(safe.nonce, ownerAddress) })

    expect(screen.getByText('Waiting')).toBeInTheDocument()
  })

  it('hides the execution step while signatures are missing and no wallet is connected', () => {
    const safe = mockSafeInfo({ threshold: 2, owners: [{ value: ownerAddress, name: null, logoUri: null }] })
    mockWallet(null)

    renderTxSigners(queuedTx(1, 2), { txSummary: oneSignatureShortSummary(safe.nonce, ownerAddress) })

    expect(screen.queryByText('Waiting')).not.toBeInTheDocument()
  })

  it('shows disabled explorer button with tooltip for queued transactions', () => {
    renderTxSigners(queuedTx(1, 2))

    const actions = within(screen.getByTestId('transaction-actions-list'))
    expect(actions.getByRole('button', { name: 'View on block explorer' })).toBeDisabled()
  })

  it('offers to copy the transaction link for a queued transaction', () => {
    renderTxSigners(queuedTx(1, 2))

    expect(screen.getByRole('button', { name: 'Copy transaction link' })).toBeInTheDocument()
  })

  it('uses the same labels for cancellation transactions as for other transactions', () => {
    const cancellation = {
      type: 'Custom' as const,
      to: addressExBuilder().build(),
      dataSize: '0',
      value: '0',
      isCancellation: true,
      methodName: null,
    }

    renderTxSigners(queuedTx(1, 2, {}, { txInfo: cancellation }))

    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Signed (1/2)')).toBeInTheDocument()
  })

  it('copies the transaction hash to clipboard via the hash button', async () => {
    const txHash = faker.string.hexadecimal({ length: 64 })
    const { user } = renderTxSigners(executedTx(2, 2, txHash))
    const writeText = spyOnClipboard()

    await user.click(screen.getByTestId('copy-tx-hash-btn'))

    expect(writeText).toHaveBeenCalledWith(txHash)
  })

  it('shows "Copied" when the pointer comes back to the hash button right after copying', async () => {
    const { user } = renderTxSigners(executedTx(2, 2))
    spyOnClipboard()
    const hashButton = screen.getByTestId('copy-tx-hash-btn')

    await user.click(hashButton)
    await user.unhover(hashButton)
    await user.hover(hashButton)

    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })

  it('disables the hash button when the transaction has no hash yet', () => {
    renderTxSigners(queuedTx(1, 2))

    expect(screen.queryByTestId('copy-tx-hash-btn')).not.toBeInTheDocument()
  })

  it('anchors the "Available after execution" tooltips on a wrapper, not on the disabled button', async () => {
    renderTxSigners(queuedTx(1, 2))

    const actionsList = screen.getByTestId('transaction-actions-list')

    for (const trigger of actionsList.querySelectorAll('[data-slot="tooltip-trigger"]')) {
      expect(trigger).not.toBeDisabled()
    }

    for (const label of ['Copy transaction hash', 'View on block explorer']) {
      const button = within(actionsList).getByLabelText(label)
      expect(button).toBeDisabled()

      const trigger = button.closest<HTMLElement>('[data-slot="tooltip-trigger"]')
      expect(trigger).not.toBe(button)
      act(() => trigger?.focus())
      expect(trigger).toHaveFocus()
      expect(await screen.findByText('Available after execution')).toBeInTheDocument()
    }
  })

  it('copies the signer address when the signer is clicked', async () => {
    const txDetails = queuedTx(1, 2)
    const [signer] = (txDetails.detailedExecutionInfo as MultisigExecutionDetails).confirmations
    const { user } = renderTxSigners(txDetails)
    const writeText = spyOnClipboard()

    await user.click(screen.getByRole('button', { name: `Copy address ${signer.signer.value}` }))

    expect(writeText).toHaveBeenCalledWith(signer.signer.value)
  })

  it('resolves address book names for actors', () => {
    const namedAddress = fakerChecksummedAddress()
    mockUseAddressBook.mockReturnValue({ [namedAddress]: 'Alice' })
    const confirmation = multisigConfirmationBuilder()
      .with({ signer: { value: namedAddress, name: null, logoUri: null } })
      .build()

    renderTxSigners(queuedTx(0, 2, { confirmations: [confirmation] }))

    expect(screen.getByText('By Alice')).toBeInTheDocument()
  })

  describe('Module-executed transactions', () => {
    const moduleTx = () =>
      transactionDetailsBuilder()
        .with({
          detailedExecutionInfo: moduleExecutionDetailsBuilder()
            .with({ address: { value: fakerChecksummedAddress(), name: 'AllowanceModule', logoUri: null } })
            .build(),
          txStatus: TransactionStatus.SUCCESS,
          executedAt: faker.date.recent().getTime(),
          txHash: faker.string.hexadecimal({ length: 64 }),
        })
        .build()

    it('renders Created and Executed rows with initiator from on-chain lookup', async () => {
      const initiatorAddr = fakerChecksummedAddress()
      mockGetTransaction.mockResolvedValue({ from: initiatorAddr })
      const txDetails = moduleTx()

      renderTxSigners(txDetails)

      const initiator = await screen.findByRole('button', { name: `Copy address ${initiatorAddr}` })
      expect(initiator).toHaveTextContent(`By ${shortenAddress(initiatorAddr)}`)
      expect(screen.queryByText('—')).not.toBeInTheDocument()
      expect(screen.getByText('Audit log')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Executed')).toBeInTheDocument()
      expect(screen.getByText(/Allowance Module/)).toBeInTheDocument()
      expect(mockGetTransaction).toHaveBeenCalledTimes(1)
      expect(mockGetTransaction).toHaveBeenCalledWith(txDetails.txHash)
    })

    it('shows dash for Created row when RPC lookup has not resolved', () => {
      mockGetTransaction.mockReturnValue(new Promise(() => {}))

      renderTxSigners(moduleTx())

      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('does not show confirmation chip for module transactions', async () => {
      const initiatorAddr = fakerChecksummedAddress()
      mockGetTransaction.mockResolvedValue({ from: initiatorAddr })

      renderTxSigners(moduleTx())

      expect(await screen.findByRole('button', { name: `Copy address ${initiatorAddr}` })).toBeInTheDocument()
      expect(screen.queryByText(/\d\/\d/)).not.toBeInTheDocument()
    })
  })

  describe('Incoming/simple executed transactions', () => {
    it('renders audit log with Executed row for incoming transactions', async () => {
      const senderAddr = fakerChecksummedAddress()
      mockGetTransaction.mockResolvedValue({ from: senderAddr })
      const txDetails = transactionDetailsBuilder()
        .with({
          detailedExecutionInfo: undefined,
          txStatus: TransactionStatus.SUCCESS,
          executedAt: faker.date.recent().getTime(),
          txHash: faker.string.hexadecimal({ length: 64 }),
        })
        .build()

      renderTxSigners(txDetails)

      const sender = await screen.findByRole('button', { name: `Copy address ${senderAddr}` })
      expect(sender).toHaveTextContent(`By ${shortenAddress(senderAddr)}`)
      expect(screen.getByText('Audit log')).toBeInTheDocument()
      expect(screen.getByText('Executed')).toBeInTheDocument()
      expect(screen.getByTestId('transaction-actions-list')).toBeInTheDocument()
    })

    it('returns null for transactions without executedAt', () => {
      const txDetails = transactionDetailsBuilder()
        .with({ detailedExecutionInfo: undefined, executedAt: null, txHash: null })
        .build()

      const { container } = renderTxSigners(txDetails)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Safenet audit step', () => {
    const SAFENET_TX_HASH: `0x${string}` = `0x${'ab'.repeat(32)}`
    const SUBMITTED_AT = 1_700_000_000_000
    const LAZY_FEATURE_TIMEOUT_MS = 10_000
    const SLOW_TEST_TIMEOUT_MS = 15_000

    const safenetTx = () => queuedTx(1, 2, { safeTxHash: SAFENET_TX_HASH, submittedAt: SUBMITTED_AT })

    const observeBenignCheck = (
      snapshot: SafenetCheckSnapshot = buildBenignSnapshot({ safeTxHash: SAFENET_TX_HASH }),
    ) => {
      mockUseHasFeature.mockReturnValue(true)
      mockSafeInfo({ chainId: '1', threshold: 2, owners: [{ value: ownerAddress, name: null, logoUri: null }] })
      mockUseSafenetCheck.mockReturnValue(
        buildCheckView({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
      )
    }

    const waitForSafenetStep = () =>
      waitFor(() => expect(screen.getByText('No issues found')).toBeInTheDocument(), {
        timeout: LAZY_FEATURE_TIMEOUT_MS,
      })

    it(
      'shows the Safenet result of this transaction with the flag on',
      async () => {
        observeBenignCheck()

        renderTxSigners(safenetTx())

        await waitForSafenetStep()
        expect(screen.getByTestId('safenet-explorer-link')).toHaveTextContent('Safenet')
      },
      SLOW_TEST_TIMEOUT_MS,
    )

    it(
      'watches the Safenet check of this transaction hash from its submission time',
      async () => {
        observeBenignCheck()

        renderTxSigners(safenetTx())

        await waitForSafenetStep()
        expect(mockUseSafenetCheck).toHaveBeenCalledWith(
          SAFENET_TX_HASH,
          SUBMITTED_AT,
          expect.objectContaining({ chainId: '1' }),
        )
      },
      SLOW_TEST_TIMEOUT_MS,
    )

    it(
      'links the Safenet step to the Safenet explorer even when the chain has a block explorer',
      async () => {
        const attested = attestedEvent({ safeTxHash: SAFENET_TX_HASH })
        observeBenignCheck(
          buildBenignSnapshot({
            safeTxHash: SAFENET_TX_HASH,
            events: [attested],
            attestation: {
              status: AttestationVerificationStatus.VERIFIED,
              signatureId: attested.signatureId,
              message: null,
            },
          }),
        )
        mockUseChain.mockReturnValue({
          blockExplorerUriTemplate: {
            txHash: 'https://gnosisscan.io/tx/{{txHash}}',
            address: 'https://gnosisscan.io/address/{{address}}',
            api: '',
          },
        } as ReturnType<typeof useChain>)

        renderTxSigners(safenetTx())

        await waitForSafenetStep()
        expect(screen.getByTestId('safenet-explorer-link')).toHaveAttribute(
          'href',
          expect.stringContaining(`/#/safeTx?chainId=1&safeTxHash=${SAFENET_TX_HASH}`),
        )
      },
      SLOW_TEST_TIMEOUT_MS,
    )

    it('renders nothing and never watches a hash with the flag off', () => {
      mockUseHasFeature.mockReturnValue(false)

      renderTxSigners(safenetTx())

      expect(screen.queryByText(/By Safenet|^Safenet$/)).not.toBeInTheDocument()
      const watchedHashes = mockUseSafenetCheck.mock.calls.map(([hash]) => hash)
      expect(watchedHashes.filter(Boolean)).toEqual([])
    })

    it(
      'draws connectors below Created and Signed when a pending transaction shows a Safenet check',
      async () => {
        observeBenignCheck()

        const { container } = renderTxSigners(safenetTx())

        await waitForSafenetStep()
        expect(screen.queryByText('Executed')).not.toBeInTheDocument()
        expect(container.getElementsByClassName('timelineLine')).toHaveLength(2)
      },
      SLOW_TEST_TIMEOUT_MS,
    )

    it('draws a connector only below Created when no Safenet check is observed', async () => {
      mockUseHasFeature.mockReturnValue(true)
      mockUseSafenetCheck.mockReturnValue(buildCheckView())

      const { container } = renderTxSigners(safenetTx())

      await waitFor(() => expect(screen.getByText(/Signed/)).toBeInTheDocument())
      expect(container.getElementsByClassName('timelineLine')).toHaveLength(1)
    })
  })
})
