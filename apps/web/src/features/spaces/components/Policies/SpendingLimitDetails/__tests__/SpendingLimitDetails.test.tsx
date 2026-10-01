import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import { TxModalContext } from '@/components/tx-flow'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'
import { ContactSource, useMergedAddressBooks, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import { act, mockClipboard, render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { mockWallet } from '@/tests/mocks/hooks'
import { useSpaceSafes } from '../../../../hooks/useSpaceSafes'
import {
  asActivePolicy,
  mockActiveSpendingLimit,
  mockMultiSpenderPolicy,
  mockActivatingPolicy,
  mockPendingPolicy,
  mockPendingRemoval,
} from '../../mocks/policies'
import type { PendingSpendingLimitPolicy } from '../../types'
import { getPendingTxId } from '../../utils/mapPendingPolicies'
import { usePendingPolicyTransaction, type PendingPolicyTransaction } from '../hooks/usePendingPolicyTransaction'
import SpendingLimitDetails from '..'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('../../../../hooks/useSpaceSafes')
jest.mock('../hooks/usePendingPolicyTransaction')
jest.mock('@/components/common/ConnectWallet/useConnectWallet')
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [], loading: false })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(() => false),
}))
// Stubbed wholesale rather than with `requireActual`: this module sits in the spaces barrel import
// cycle, and pulling the real one in from a mock factory dies on its own TDZ.
jest.mock('@/hooks/useAllAddressBooks', () => ({
  __esModule: true,
  ContactSource: { space: 'space', local: 'local' },
  useMergedAddressBooks: jest.fn(),
}))

const mockUseSpaceSafes = useSpaceSafes as jest.MockedFunction<typeof useSpaceSafes>
const mockUsePendingPolicyTransaction = jest.mocked(usePendingPolicyTransaction)
const mockUseConnectWallet = jest.mocked(useConnectWallet)
const mockUseChain = jest.mocked(useChain)
const mockUseMergedAddressBooks = useMergedAddressBooks as jest.MockedFunction<typeof useMergedAddressBooks>

const contact = (address: string, name: string, source: ContactSource): ExtendedContact => ({
  address,
  name,
  source,
  chainIds: [policy.safe.chainId],
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
})

/** The real hook merges the two books; the panel is asked which one it reads a spender from. */
const mockAddressBooks = ({
  space = {},
  local = {},
}: {
  space?: Record<string, string>
  local?: Record<string, string>
}) => {
  const lookup = (book: Record<string, string>, source: ContactSource) => (address: string) => {
    const entry = Object.entries(book).find(([key]) => sameAddress(key, address))
    return entry ? contact(entry[0], entry[1], source) : undefined
  }
  const getFromSpace = lookup(space, ContactSource.space)
  const getFromLocal = lookup(local, ContactSource.local)

  mockUseMergedAddressBooks.mockReturnValue({
    list: [],
    get: (address: string) => getFromSpace(address) ?? getFromLocal(address),
    getFromSpace,
    getFromLocal,
    has: (address: string) => Boolean(getFromSpace(address) ?? getFromLocal(address)),
  })
}

const policy = mockActiveSpendingLimit()

const mockSpaceSafes = (isReadOnly: boolean, { chainId, address } = policy.safe) => {
  const safe = safeItemBuilder().with({ chainId, address, isReadOnly }).build()

  mockUseSpaceSafes.mockReturnValue({
    allSafes: [safe],
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
    isUninitialized: false,
  })
}

const setup = () => render(<SpendingLimitDetails policy={policy} onClose={jest.fn()} />)

describe('SpendingLimitDetails', () => {
  beforeEach(() => {
    mockAddressBooks({})
  })

  it('shows a signer of the Safe the edit action, waiting on the edit flow', () => {
    mockWallet()
    mockSpaceSafes(false)

    setup()

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByText('Editing a spending limit is coming soon.')).toBeInTheDocument()
  })

  it('tells a wallet that does not sign for the Safe why it cannot edit', () => {
    mockWallet()
    mockSpaceSafes(true)

    setup()

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByText('Only signers of this Safe account can edit this spending limit.')).toBeInTheDocument()
  })

  it('asks for a wallet before offering anything to do', () => {
    mockWallet(null)
    mockSpaceSafes(false)

    setup()

    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeInTheDocument()
  })

  it('names a spender from the Space address book, and leaves an unknown one as its address', () => {
    mockWallet()
    mockSpaceSafes(false)
    const multiSpender = asActivePolicy(mockMultiSpenderPolicy())
    const [named, , unnamed] = multiSpender.data.spenders
    mockAddressBooks({ space: { [named.spender]: 'Payroll bot' } })

    render(<SpendingLimitDetails policy={multiSpender} onClose={jest.fn()} />)

    expect(screen.getByText('Payroll bot')).toBeInTheDocument()
    expect(screen.getByText(getSafeDisplayInfo('', unnamed.spender).shortAddress)).toBeInTheDocument()
  })

  it('ignores a spender name that exists only in the local address book', () => {
    mockWallet()
    mockSpaceSafes(false)
    const multiSpender = asActivePolicy(mockMultiSpenderPolicy())
    const [named] = multiSpender.data.spenders
    mockAddressBooks({ local: { [named.spender]: 'My own label' } })

    render(<SpendingLimitDetails policy={multiSpender} onClose={jest.fn()} />)

    expect(screen.queryByText('My own label')).not.toBeInTheDocument()
    expect(screen.getByText(getSafeDisplayInfo('', named.spender).shortAddress)).toBeInTheDocument()
  })

  it('renders the usage of the policy the row carries, without fetching it again', () => {
    mockWallet()
    mockSpaceSafes(false)

    setup()

    expect(screen.getAllByRole('progressbar')).toHaveLength(policy.data.spenders[0].allowances.length)
    expect(screen.queryByText('Last updated')).not.toBeInTheDocument()
  })

  it('hands the Edit button to the caller', async () => {
    mockWallet()
    mockSpaceSafes(false)
    const onEdit = jest.fn()

    const { user } = renderWithUserEvent(<SpendingLimitDetails policy={policy} onClose={jest.fn()} onEdit={onEdit} />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })
})

describe('a pending spending limit', () => {
  const pending = mockPendingPolicy()
  const txSummary = { id: getPendingTxId(pending) } as Transaction
  const chain = chainBuilder().with({ chainId: pending.safe.chainId }).build()
  const connectWallet = jest.fn()

  const mockPendingTx = (tx: Partial<PendingPolicyTransaction>) =>
    mockUsePendingPolicyTransaction.mockReturnValue({ confirmedBy: [], ...tx })

  const renderPending = (policy: PendingSpendingLimitPolicy = pending, isUnlisted?: boolean) =>
    renderWithUserEvent(<SpendingLimitDetails policy={policy} isUnlisted={isUnlisted} onClose={jest.fn()} />)

  beforeEach(() => {
    jest.clearAllMocks()
    mockAddressBooks({})
    mockUseChain.mockReturnValue(chain)
    mockUseConnectWallet.mockReturnValue(connectWallet)
  })

  const SPACE_ID = '9f3c1a2b-4d5e-4f60-8a7b-1c2d3e4f5a6b'

  const renderInSpace = (policy: PendingSpendingLimitPolicy = pending) =>
    render(<SpendingLimitDetails policy={policy} onClose={jest.fn()} />, {
      routerProps: { query: { spaceId: SPACE_ID } },
    })

  const expectReviewLinkToQueuedTx = () => {
    const href = screen.getByRole('link', { name: 'Review transaction' }).getAttribute('href')
    const url = new URL(href ?? '', window.location.origin)

    expect(url.pathname).toBe(AppRoutes.transactions.tx)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      id: getPendingTxId(pending),
      safe: `${chain.shortName}:${pending.safe.address}`,
      spaceId: SPACE_ID,
    })
  }

  it('links a signer who has not signed to the transaction in the Safe queue', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ txSummary })

    renderInSpace(mockPendingPolicy({ confirmationsSubmitted: 0, confirmationsRequired: 2 }))

    expectReviewLinkToQueuedTx()
  })

  it('links anyone to the queue to execute a fully signed transaction', () => {
    mockWallet()
    mockSpaceSafes(true, pending.safe)
    mockPendingTx({ txSummary, confirmationsSubmitted: 2 })

    renderInSpace(mockPendingPolicy({ confirmationsSubmitted: 2, confirmationsRequired: 2 }))

    expectReviewLinkToQueuedTx()
  })

  it('offers a signer who already signed the link to share instead', () => {
    const wallet = mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ confirmedBy: [wallet!.address.toLowerCase()], txSummary })

    renderPending()

    expect(screen.getByRole('button', { name: 'Copy transaction link' })).toBeInTheDocument()
    expect(screen.getByText(/You've signed/)).toBeInTheDocument()
  })

  it('shows the fresh signature count from the transaction, not the cached row', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ confirmationsSubmitted: 1, txSummary })

    renderPending(mockPendingPolicy({ confirmationsSubmitted: 0, confirmationsRequired: 2 }))

    expect(screen.getByText('1 of 2 signed')).toBeInTheDocument()
  })

  it('copies a link that opens the transaction on its Safe, without the Space', async () => {
    mockWallet()
    mockSpaceSafes(true, pending.safe)
    mockPendingTx({ txSummary })

    renderInSpace()
    const writeText = mockClipboard()
    act(() => {
      screen.getByRole('button', { name: 'Copy transaction link' }).click()
    })

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}${AppRoutes.transactions.tx}?safe=${chain.shortName}:${pending.safe.address}&id=${getPendingTxId(pending)}`,
      )
    })
  })

  it('offers Review transaction before the transaction has loaded, without asking to sign yet', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({})

    renderInSpace()

    expectReviewLinkToQueuedTx()
    expect(screen.queryByText(/Sign and execute/)).not.toBeInTheDocument()
  })

  it('keeps Review transaction disabled until the chain configs have loaded', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ txSummary })
    mockUseChain.mockReturnValue(undefined)

    renderPending()

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled()
  })

  it('offers to try again when the transaction could not be loaded', async () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    const onRetry = jest.fn()
    mockPendingTx({ onRetry })

    const { user } = renderPending()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText("The transaction couldn't be loaded.")).toBeInTheDocument()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('hides the panel while a transaction flow is open, so its overlay does not cover the flow', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ txSummary })

    render(
      <TxModalContext.Provider value={{ txFlow: <div />, setTxFlow: jest.fn(), setFullWidth: jest.fn() }}>
        <SpendingLimitDetails policy={pending} onClose={jest.fn()} />
      </TxModalContext.Provider>,
    )

    expect(screen.queryByRole('button', { name: 'Review transaction' })).not.toBeInTheDocument()
  })

  it('stops offering Review once the row has left the list, until it learns why', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ txSummary })

    renderPending(pending, true)

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled()
    expect(mockUsePendingPolicyTransaction).toHaveBeenCalledWith(pending, true)
  })

  it('opens the connect dialog, then shows the connected signer their state in the same panel', async () => {
    mockWallet(null)
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ txSummary })

    const { user, rerender } = renderPending()
    await user.click(screen.getByRole('button', { name: 'Connect wallet' }))
    expect(connectWallet).toHaveBeenCalledTimes(1)

    mockWallet()
    rerender(<SpendingLimitDetails policy={pending} onClose={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Review transaction' })).toBeInTheDocument()
  })

  it('reports a replaced transaction instead of offering a CTA that would fail', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ txSummary, outcome: 'replaced' })

    renderPending()

    expect(screen.queryByRole('button', { name: 'Review transaction' })).not.toBeInTheDocument()
    expect(screen.getByText(/can no longer be executed/)).toBeInTheDocument()
  })

  it('reports an executed row waiting for the indexer as executed, before its transaction has loaded', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({})

    renderPending(mockActivatingPolicy())

    expect(screen.getByText('The transaction was executed.')).toBeInTheDocument()
    expect(screen.getByText('Activating')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review transaction' })).not.toBeInTheDocument()
  })

  it('says the limit stays active while its removal is pending', () => {
    mockWallet()
    mockSpaceSafes(false, pending.safe)
    mockPendingTx({ txSummary })

    renderPending(mockPendingRemoval())

    expect(screen.getByText('This spending limit is still active until the removal is executed.')).toBeInTheDocument()
  })
})
