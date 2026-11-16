import { fireEvent, render, screen } from '@/tests/test-utils'
import { chainBuilder as mockChainBuilder } from '@/tests/builders/chains'
import SpaceInfoModal from '../index'

const mockEthereumLogo = 'https://example.com/chains/1/chain_logo.png'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useChain: jest.fn((chainId: string) =>
    chainId === '1' ? mockChainBuilder().with({ chainId: '1', chainLogoUri: mockEthereumLogo }).build() : undefined,
  ),
}))

describe('SpaceInfoModal', () => {
  it('renders the workspaces headline and benefits', () => {
    render(<SpaceInfoModal onClose={jest.fn()} />)

    expect(screen.getByText('One Workspace for your team.')).toBeInTheDocument()
    expect(screen.getByText('Every Safe in one view')).toBeInTheDocument()
    expect(screen.getByText('Access by role')).toBeInTheDocument()
    expect(screen.getByText('Security & audit in one view')).toBeInTheDocument()
  })

  it('links to the workspaces help article', () => {
    render(<SpaceInfoModal onClose={jest.fn()} />)

    expect(screen.getByRole('link', { name: /learn more/i })).toHaveAttribute(
      'href',
      expect.stringContaining('help.safe.global'),
    )
  })

  it('shows chain logos from the chain config and none for a chain it does not have', () => {
    render(<SpaceInfoModal onClose={jest.fn()} />)

    expect(screen.getByAltText('Ethereum logo')).toHaveAttribute('src', mockEthereumLogo)
    expect(screen.queryByAltText('Base logo')).not.toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    render(<SpaceInfoModal onClose={onClose} />)

    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[0])

    expect(onClose).toHaveBeenCalled()
  })
})
