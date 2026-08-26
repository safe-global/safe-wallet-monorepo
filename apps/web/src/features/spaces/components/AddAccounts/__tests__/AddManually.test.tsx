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
  default: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="modal-dialog">{children}</div> : null,
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

  it('shows the network label on the closed network trigger for the default chain', async () => {
    render(<AddManually handleAddSafe={jest.fn()} />)

    fireEvent.click(screen.getByTestId('add-manually-button'))

    await waitFor(() => {
      expect(screen.getByTestId('network-selector')).toHaveTextContent(`Chain ${chains.eth}`)
    })
  })
})
