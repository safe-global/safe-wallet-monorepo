import { render, screen, fireEvent } from '@/tests/test-utils'
import AddManually from '../AddManually'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [] }),
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
  default: () => <div data-testid="chain-indicator" />,
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
})
