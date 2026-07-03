import { render, screen } from '@/tests/test-utils'
import { FeeTokenPreference } from '.'
import { useHasFeature } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useAsync from '@safe-global/utils/hooks/useAsync'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useHasFeature: jest.fn(() => true),
}))

jest.mock('@/hooks/wallets/useWallet')

jest.mock('@/hooks/wallets/web3')

jest.mock('@safe-global/utils/hooks/useAsync')

describe('FeeTokenPreference', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useHasFeature as jest.MockedFunction<typeof useHasFeature>).mockReturnValue(true)
    ;(useWallet as jest.MockedFunction<typeof useWallet>).mockReturnValue(null)
    ;(useWeb3ReadOnly as jest.MockedFunction<typeof useWeb3ReadOnly>).mockReturnValue(undefined)
    ;(useAsync as jest.MockedFunction<typeof useAsync>).mockReturnValue([undefined, undefined, false])
  })

  it('renders the fee token preference settings in a shared card shell', () => {
    render(<FeeTokenPreference />)

    expect(screen.getByText('Fee token preference').closest('[data-slot="card"]')).toHaveClass('mt-4')
    expect(screen.getByText('Please connect your wallet to configure fee token preference.')).toBeInTheDocument()
  })

  it('does not render when Tempo gas token support is disabled', () => {
    ;(useHasFeature as jest.MockedFunction<typeof useHasFeature>).mockReturnValue(false)

    const { container } = render(<FeeTokenPreference />)

    expect(container).toBeEmptyDOMElement()
  })
})
