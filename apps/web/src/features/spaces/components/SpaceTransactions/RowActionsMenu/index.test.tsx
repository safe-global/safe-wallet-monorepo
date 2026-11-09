import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
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

const mockSafeAddress = checksumAddress(faker.finance.ethereumAddress())
const safeAddress = mockSafeAddress
const mockChain = chainBuilder().with({ chainId: '137', shortName: 'pol' }).build()
jest.mock('@safe-global/views/components/tx-flow/safe-scope/context', () => ({
  useSafeScope: () => ({ chainId: '137', safeAddress: mockSafeAddress }),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [mockChain] }),
  useChain: () => mockChain,
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
