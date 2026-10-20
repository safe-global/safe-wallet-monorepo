import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { mockCurrentChain, mockWallet } from '@/tests/mocks/hooks'
import { deleteTx } from '@/utils/gateway'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import DeleteTxModal from './DeleteTxModal'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useChains')
jest.mock('@/hooks/useSafeAddress')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/utils/gateway')
jest.mock('@/services/tx/tx-sender/sdk')
jest.mock('@/services/analytics')

let mockIsWalletOk = true
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(mockIsWalletOk),
}))

const mockUseSafeAddress = jest.requireMock('@/hooks/useSafeAddress').default as jest.Mock
const mockUseChains = jest.requireMock('@/hooks/useChains').default as jest.Mock
const mockDeleteTx = jest.mocked(deleteTx)

const SAFE_TX_HASH = faker.string.hexadecimal({ length: 64 })
const CONFIRM_BUTTON = 'Yes, delete'
const ERROR_TITLE = 'Error deleting transaction'

const onSuccess = jest.fn()
const onClose = jest.fn()

const renderModal = () =>
  renderWithUserEvent(<DeleteTxModal safeTxHash={SAFE_TX_HASH} onSuccess={onSuccess} onClose={onClose} />)

describe('DeleteTxModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsWalletOk = true
    mockWallet()
    mockCurrentChain()
    mockUseChains.mockReturnValue({ configs: [] })
    mockUseSafeAddress.mockReturnValue(faker.finance.ethereumAddress())
    mockDeleteTx.mockResolvedValue(undefined)
  })

  it('warns that deleting is permanent and that given signatures stay valid', () => {
    renderModal()

    expect(screen.getByText('Delete this transaction?')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Are you sure you want to delete this transaction? This will permanently remove it from the queue ' +
          'but the already given signatures will remain valid.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /potential risks/ })).toBeInTheDocument()
  })

  it('deletes the transaction, announces the deletion and reports success', async () => {
    const onDeleted = jest.fn()
    const unsubscribe = txSubscribe(TxEvent.DELETED, onDeleted)
    const { user } = renderModal()

    await user.click(screen.getByRole('button', { name: CONFIRM_BUTTON }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(mockDeleteTx).toHaveBeenCalledWith(expect.objectContaining({ safeTxHash: SAFE_TX_HASH }))
    expect(onDeleted).toHaveBeenCalledWith({ safeTxHash: SAFE_TX_HASH })
    unsubscribe()
  })

  it('shows an error and stays open when the deletion fails', async () => {
    const onDeleted = jest.fn()
    const unsubscribe = txSubscribe(TxEvent.DELETED, onDeleted)
    mockDeleteTx.mockRejectedValue(new Error('Request failed with status 403'))
    const { user } = renderModal()

    await user.click(screen.getByRole('button', { name: CONFIRM_BUTTON }))

    expect(await screen.findByText(ERROR_TITLE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: CONFIRM_BUTTON })).toBeEnabled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('does not try to delete when the wallet has no provider', async () => {
    mockWallet({ provider: undefined })
    const { user } = renderModal()

    await user.click(screen.getByRole('button', { name: CONFIRM_BUTTON }))

    expect(await screen.findByText(ERROR_TITLE)).toBeInTheDocument()
    expect(mockDeleteTx).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('disables deleting until the wallet can transact', () => {
    mockIsWalletOk = false

    renderModal()

    expect(screen.getByRole('button', { name: CONFIRM_BUTTON })).toBeDisabled()
  })

  it('closes without deleting when the user keeps the transaction', async () => {
    const { user } = renderModal()

    await user.click(screen.getByRole('button', { name: 'Keep it' }))

    expect(onClose).toHaveBeenCalled()
    expect(mockDeleteTx).not.toHaveBeenCalled()
  })
})
