import { render, screen } from '@testing-library/react'
import NetworkLogosList from './index'

jest.mock('@/components/common/ChainIndicator', () => {
  const ChainIndicator = ({ chainId }: { chainId: string }) => <span data-testid={`chain-${chainId}`} />
  return ChainIndicator
})

const networks = (ids: string[]) => ids.map((chainId) => ({ chainId }))

describe('NetworkLogosList', () => {
  describe('showHasMore=false (default)', () => {
    it('renders all logos without overflow indicator', () => {
      render(<NetworkLogosList networks={networks(['1', '137', '10', '42161', '8453'])} />)

      expect(screen.getByTestId('chain-1')).toBeInTheDocument()
      expect(screen.getByTestId('chain-8453')).toBeInTheDocument()
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
    })
  })

  describe('showHasMore=true with default maxVisible=4', () => {
    it('renders 4 logos and overflow indicator when there are more than 4 networks', () => {
      render(<NetworkLogosList networks={networks(['1', '137', '10', '42161', '8453', '100'])} showHasMore />)

      expect(screen.getByTestId('chain-1')).toBeInTheDocument()
      expect(screen.getByTestId('chain-42161')).toBeInTheDocument()
      expect(screen.queryByTestId('chain-8453')).not.toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    it('does not render overflow indicator when networks count equals maxVisible', () => {
      render(<NetworkLogosList networks={networks(['1', '137', '10', '42161'])} showHasMore />)

      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
    })
  })

  describe('showHasMore=true with maxVisible=3', () => {
    it('renders 3 logos and overflow indicator when there are more than 3 networks', () => {
      render(<NetworkLogosList networks={networks(['1', '137', '10', '42161', '8453'])} showHasMore maxVisible={3} />)

      expect(screen.getByTestId('chain-1')).toBeInTheDocument()
      expect(screen.getByTestId('chain-10')).toBeInTheDocument()
      expect(screen.queryByTestId('chain-42161')).not.toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    it('shows correct overflow count', () => {
      render(
        <NetworkLogosList
          networks={networks(['1', '137', '10', '42161', '8453', '100', '56'])}
          showHasMore
          maxVisible={3}
        />,
      )

      expect(screen.getByText('+4')).toBeInTheDocument()
    })

    it('does not render overflow indicator when networks count equals maxVisible', () => {
      render(<NetworkLogosList networks={networks(['1', '137', '10'])} showHasMore maxVisible={3} />)

      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
    })

    it('does not render overflow indicator when networks count is less than maxVisible', () => {
      render(<NetworkLogosList networks={networks(['1', '137'])} showHasMore maxVisible={3} />)

      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
    })
  })
})
