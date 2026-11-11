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
    render(<RowActionsMenu tx={tx(12)} canReject />)
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Replace with a transfer' }))

    render(mockSetTxFlow.mock.calls[0][0])
    expect(screen.getByText('transfer flow 12')).toBeInTheDocument()
  })

  it('opens an on-chain rejection of the nonce', async () => {
    render(<RowActionsMenu tx={tx(7)} canReject />)
    openMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Reject' }))

    render(mockSetTxFlow.mock.calls[0][0])
    expect(screen.getByText('reject flow 7')).toBeInTheDocument()
  })

  it('does not offer a second rejection of a nonce', async () => {
    render(<RowActionsMenu tx={tx(7)} canReject={false} />)
    openMenu()

    expect(await screen.findByRole('menuitem', { name: 'Reject' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('menuitem', { name: 'Replace with a transfer' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('disables replacing and rejecting for a wallet that cannot sign, but still copies the link', async () => {
    mockIsOk.current = false
    render(<RowActionsMenu tx={tx(7)} canReject />)
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

    render(<RowActionsMenu tx={transaction} canReject />)
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
    render(<RowActionsMenu tx={transaction} canReject />)
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

    fireEvent.click(screen.getByRole('button', { name: 'close delete modal' }))
    expect(screen.queryByText(/delete modal/)).not.toBeInTheDocument()
  })

  it('loads the details only once the menu is opened', () => {
    render(<RowActionsMenu tx={tx(9)} canReject />)
    expect(mockGetTxDetails).not.toHaveBeenCalled()
  })

  it('lets a proposer whose wallet cannot sign still delete', async () => {
    mockIsOk.current = false
    render(<RowActionsMenu tx={tx(9)} canReject />)
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
    render(<RowActionsMenu tx={tx(9)} canReject />)
    openMenu()

    await expectBlockedWithReason('Delete the later transactions first, or replace this one.')
  })

  it('shows deleting as disabled to a wallet that did not propose the transaction', async () => {
    mockGetTxDetails.mockReturnValue(details(checksumAddress(faker.finance.ethereumAddress())))
    render(<RowActionsMenu tx={tx(9)} canReject />)
    openMenu()

    await expectBlockedWithReason('Only the person who proposed it can delete it.')
  })

  it('shows deleting as disabled and skips loading the details without a connected wallet', async () => {
    mockWallet.current = null
    render(<RowActionsMenu tx={tx(9)} canReject />)
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
