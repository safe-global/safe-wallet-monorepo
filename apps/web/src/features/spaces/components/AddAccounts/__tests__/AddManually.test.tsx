import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import chains from '@safe-global/utils/config/chains'
import AddManually from '../AddManually'

const chainConfigs = [
  chainBuilder().with({ chainId: chains.eth, chainName: 'Ethereum' }).build(),
  chainBuilder().with({ chainId: '137', chainName: 'Polygon' }).build(),
]

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: chainConfigs }),
  useHasFeature: () => false,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  useLazySafesGetSafeV1Query: () => [jest.fn()],
}))

jest.mock('@/components/common/AddressInput', () => ({
  __esModule: true,
  default: () => <div data-testid="address-input" />,
}))

jest.mock('@/components/common/ChainIndicator', () => ({
  __esModule: true,
  default: ({ chainId }: { chainId: string }) => <span>Chain {chainId}</span>,
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({
    open,
    children,
    forceBackdrop,
  }: {
    open: boolean
    children: React.ReactNode
    forceBackdrop?: boolean
  }) =>
    open ? (
      <div data-testid="modal-dialog" data-force-backdrop={String(Boolean(forceBackdrop))}>
        {children}
      </div>
    ) : null,
}))

describe('AddManually', () => {
  it('enables the trigger button by default', () => {
    render(<AddManually handleAddSafe={jest.fn()} />)

    expect(screen.getByTestId('add-manually-button')).not.toBeDisabled()
  })

  it('disables the trigger button when disabled is true', () => {
    render(<AddManually handleAddSafe={jest.fn()} disabled />)

    expect(screen.getByTestId('add-manually-button')).toBeDisabled()
  })

  it('does not open the dialog when disabled and clicked', () => {
    render(<AddManually handleAddSafe={jest.fn()} disabled />)

    fireEvent.click(screen.getByTestId('add-manually-button'))

    expect(screen.queryByTestId('modal-dialog')).not.toBeInTheDocument()
  })

  // The dialog is nested inside the "My accounts" picker dialog, and Base UI drops the backdrop of a
  // nested dialog. Without forceBackdrop the two surfaces render with nothing between them.
  it('forces its own backdrop so it does not merge into the dialog behind it', () => {
    render(<AddManually handleAddSafe={jest.fn()} />)

    fireEvent.click(screen.getByTestId('add-manually-button'))

    expect(screen.getByTestId('modal-dialog')).toHaveAttribute('data-force-backdrop', 'true')
  })

  it('shows the network label on the closed network trigger for the default chain', async () => {
    render(<AddManually handleAddSafe={jest.fn()} />)

    fireEvent.click(screen.getByTestId('add-manually-button'))

    await waitFor(() => {
      expect(screen.getByTestId('network-selector')).toHaveTextContent(`Chain ${chains.eth}`)
    })
  })
})
