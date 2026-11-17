import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import userEvent from '@testing-library/user-event'
import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import RowActionsMenu, { getTxLink } from '.'
import { DeleteTxDialogProvider } from './DeleteTxDialog'

const mockSetTxFlow = jest.fn()
jest.mock('@/components/tx-flow/safe-scope/useSetScopedTxFlow', () => ({
  __esModule: true,
  default: () => mockSetTxFlow,
}))

const mockIsOk = { current: true }
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(mockIsOk.current),
}))

jest.mock('@/components/tx-flow/flows', () => ({
  TokenTransferFlow: (props: { txNonce: number }) => <div>transfer flow {props.txNonce}</div>,
}))
jest.mock('@/components/tx-flow/flows/RejectTx', () => ({
  __esModule: true,
  default: (props: { txNonce: number }) => <div>reject flow {props.txNonce}</div>,
}))

const mockIsNonceDeletable = jest.fn<boolean, [number]>(() => true)
jest.mock('@/components/tx-flow/flows/ReplaceTx', () => ({
  useIsNonceDeletable: (nonce: number) => mockIsNonceDeletable(nonce),
}))
jest.mock('@/components/tx-flow/flows/ReplaceTx/DeleteTxModal', () => ({
  __esModule: true,
  default: (props: { safeTxHash: string; onClose: () => void }) => (
    <div>
      delete modal {props.safeTxHash}
      <button onClick={props.onClose}>close delete modal</button>
    </div>
  ),
}))

jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: ({
    initial,
    children,
  }: {
    initial: { chainId: string; safeAddress: string }
    children: ReactElement
  }) => (
    <div data-testid="delete-scope" data-chain-id={initial.chainId} data-safe-address={initial.safeAddress}>
      {children}
    </div>
  ),
}))

const mockWallet: { current: { address: string } | null } = { current: null }
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWallet.current,
}))

const mockGetTxDetails = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/transactions'),
  useTransactionsGetTransactionByIdV1Query: (args: unknown) => mockGetTxDetails(args),
}))

const mockSafeAddress = checksumAddress(faker.finance.ethereumAddress())
const safeAddress = mockSafeAddress
const mockChain = chainBuilder()
  .with({ chainId: '137', shortName: 'pol', features: [FEATURES.DELETE_TX] as Chain['features'] })
  .build()
jest.mock('@safe-global/views/components/tx-flow/safe-scope/context', () => ({
  useSafeScope: () => ({ chainId: '137', safeAddress: mockSafeAddress }),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [mockChain] }),
  useChain: (chainId: string) => (chainId === '137' ? mockChain : undefined),
  useCurrentChain: () => mockChain,
  useHasFeature: () => false,
}))

const tx = (nonce: number): Transaction =>
  ({
    id: `multisig_${safeAddress}_${faker.string.hexadecimal({ length: 64 })}`,
    txStatus: 'AWAITING_CONFIRMATIONS',
    executionInfo: { type: 'MULTISIG', nonce, confirmationsRequired: 2, confirmationsSubmitted: 1 },
  }) as Transaction

const renderMenu = (transaction: Transaction, canReject = true) =>
  render(
    <DeleteTxDialogProvider>
      <RowActionsMenu tx={transaction} canReject={canReject} />
    </DeleteTxDialogProvider>,
  )

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: /More actions/ }))

describe('RowActionsMenu', () => {
  beforeEach(() => {
    mockSetTxFlow.mockReset()
    mockIsOk.current = true
    mockWallet.current = null
    mockIsNonceDeletable.mockReturnValue(true)
    mockGetTxDetails.mockReset().mockReturnValue({ currentData: undefined })
  })

  it('opens a transfer with the same nonce to replace the transaction', async () => {
    renderMenu(tx(12))
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Replace with a transfer' }))

    render(mockSetTxFlow.mock.calls[0][0])
    expect(screen.getByText('transfer flow 12')).toBeInTheDocument()
  })

  it('opens an on-chain rejection of the nonce', async () => {
    renderMenu(tx(7))
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Reject' }))

    render(mockSetTxFlow.mock.calls[0][0])
    expect(screen.getByText('reject flow 7')).toBeInTheDocument()
  })

  it('does not offer a second rejection of a nonce', async () => {
    renderMenu(tx(7), false)
    openMenu()

    const reject = await screen.findByRole('menuitem', { name: 'Reject' })
    expect(reject).toHaveAttribute('aria-disabled', 'true')
    await userEvent.hover(reject.parentElement!)
    expect(await screen.findByText('Transaction with nonce 7 already has a reject transaction')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Replace with a transfer' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('disables replacing and rejecting for a wallet that cannot sign, but still copies the link', async () => {
    mockIsOk.current = false
    renderMenu(tx(7))
    openMenu()

    expect(await screen.findByRole('menuitem', { name: 'Replace with a transfer' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByRole('menuitem', { name: 'Reject' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('menuitem', { name: 'Copy link' })).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('copies the link to the transaction in the Safe of the row', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const transaction = tx(7)

    renderMenu(transaction)
    openMenu()
    await act(async () => {
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy link' }))
    })

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const url = new URL(writeText.mock.calls[0][0])
    expect(url.pathname).toBe('/transactions/tx')
    expect(url.searchParams.get('safe')).toBe(`pol:${safeAddress}`)
    expect(url.searchParams.get('id')).toBe(transaction.id)
  })
})

describe('RowActionsMenu delete', () => {
  const proposer = checksumAddress(faker.finance.ethereumAddress())
  const safeTxHash = faker.string.hexadecimal({ length: 64 })
  const details = (proposerAddress: string) => ({
    currentData: {
      detailedExecutionInfo: { type: 'MULTISIG', safeTxHash, proposer: { value: proposerAddress } },
    },
  })

  beforeEach(() => {
    mockIsOk.current = true
    mockIsNonceDeletable.mockReset().mockReturnValue(true)
    mockWallet.current = { address: proposer }
    mockGetTxDetails.mockReset().mockReturnValue(details(proposer))
  })

  it('lets the proposer delete the transaction from the scoped Safe, after the other actions', async () => {
    const transaction = tx(9)
    renderMenu(transaction)
    openMenu()

    const deleteItem = await screen.findByRole('menuitem', { name: 'Delete from queue' })
    expect(deleteItem).not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Replace with a transfer',
      'Reject',
      'Copy link',
      'Delete from queue',
    ])
    expect(mockGetTxDetails).toHaveBeenCalledWith({ chainId: '137', id: transaction.id })
    expect(mockIsNonceDeletable).toHaveBeenCalledWith(9)

    fireEvent.click(deleteItem)
    expect(await screen.findByText(`delete modal ${safeTxHash}`)).toBeInTheDocument()
    expect(screen.getByTestId('delete-scope')).toHaveAttribute('data-chain-id', '137')
    expect(screen.getByTestId('delete-scope')).toHaveAttribute('data-safe-address', mockSafeAddress)

    fireEvent.click(screen.getByRole('button', { name: 'close delete modal' }))
    expect(screen.queryByText(/delete modal/)).not.toBeInTheDocument()
  })

  it('keeps the delete confirmation open when the row leaves the list', async () => {
    const transaction = tx(9)
    const { rerender } = renderMenu(transaction)
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete from queue' }))
    expect(await screen.findByText(`delete modal ${safeTxHash}`)).toBeInTheDocument()

    rerender(<DeleteTxDialogProvider>{null}</DeleteTxDialogProvider>)

    expect(screen.getByText(`delete modal ${safeTxHash}`)).toBeInTheDocument()
  })

  it('loads the details only once the menu is opened', () => {
    renderMenu(tx(9))
    expect(mockGetTxDetails).not.toHaveBeenCalled()
  })

  it('lets a proposer whose wallet cannot sign still delete', async () => {
    mockIsOk.current = false
    renderMenu(tx(9))
    openMenu()

    expect(await screen.findByRole('menuitem', { name: 'Delete from queue' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  const expectBlockedWithReason = async (reason: string) => {
    const item = await screen.findByRole('menuitem', { name: 'Delete from queue' })
    expect(item).toHaveAttribute('aria-disabled', 'true')
    await userEvent.hover(item.parentElement!)
    expect(await screen.findByText(reason)).toBeInTheDocument()
  }

  it('explains why a transaction that would leave a nonce gap cannot be deleted', async () => {
    mockIsNonceDeletable.mockReturnValue(false)
    renderMenu(tx(9))
    openMenu()

    await expectBlockedWithReason('Delete the later transactions first, or replace this one.')
  })

  it('shows deleting as disabled to a wallet that did not propose the transaction', async () => {
    mockGetTxDetails.mockReturnValue(details(checksumAddress(faker.finance.ethereumAddress())))
    renderMenu(tx(9))
    openMenu()

    await expectBlockedWithReason('Only the person who proposed it can delete it.')
  })

  it('shows deleting as disabled and skips loading the details without a connected wallet', async () => {
    mockWallet.current = null
    renderMenu(tx(9))
    openMenu()

    await expectBlockedWithReason('Only the person who proposed it can delete it.')
    expect(mockGetTxDetails).not.toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }))
  })
})

describe('getTxLink', () => {
  it('keeps the Workspace in the link', () => {
    const spaceId = faker.string.uuid()
    const link = getTxLink({
      origin: 'https://app.safe.global',
      chainShortName: 'eth',
      safeAddress,
      txId: 'tx1',
      spaceId,
    })

    expect(link).toBe(`https://app.safe.global/transactions/tx?safe=eth:${safeAddress}&id=tx1&spaceId=${spaceId}`)
  })
})
