import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import FeesPreview from './index'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ nativeCurrency: { symbol: 'ETH', logoUri: 'https://example/eth.svg' } }),
}))

const defaultProps: FeesPreviewData = {
  canCoverFees: true,
  executionFee: { label: 'Execution fee', isFree: true },
  gasFee: { label: 'Max gas fee', amount: '0.0002733', currency: 'ETH', fiatAmount: '$97.30' },
  totalOutgoing: { primary: [{ amount: '0.60126', currency: 'ETH' }], fiatTotal: '$1,768.85' },
  availableGasTokens: [{ address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', logoUri: '' }],
  selectedGasToken: '0x0000000000000000000000000000000000000000',
  onGasTokenChange: jest.fn(),
}

describe('FeesPreview', () => {
  it('renders "Fees" header and "How fees work" link', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Fees')).toBeInTheDocument()
    expect(screen.getByText(/How fees work/)).toBeInTheDocument()
  })

  it('renders payment source selector with Safe active by default', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Pay fees from:')).toBeInTheDocument()
    expect(screen.getByTestId('payment-source-selector')).toHaveTextContent('Safe')
    expect(screen.getByText('Fees token:')).toBeInTheDocument()
  })

  it('renders gas token selector', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('ETH')).toBeInTheDocument()
  })

  it('renders execution fee as FREE only (no amount, no percentage)', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('FREE')).toBeInTheDocument()
    expect(screen.queryByText(/Execution fee \(/)).not.toBeInTheDocument()
  })

  it('renders gas fee with fiat', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Max gas fee')).toBeInTheDocument()
    expect(screen.getByText('$97.30')).toBeInTheDocument()
  })

  it('renders total outgoing when Safe wallet selected', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Total outgoing')).toBeInTheDocument()
    expect(screen.getByText('0.60126 ETH')).toBeInTheDocument()
    expect(screen.getByText('$1,768.85')).toBeInTheDocument()
  })

  it('keeps total outgoing visible after switching payment source to Signer', () => {
    render(<FeesPreview {...defaultProps} />)

    fireEvent.click(screen.getByTestId('payment-source-selector'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Signer' }))

    expect(screen.getByText('Total outgoing')).toBeInTheDocument()
  })

  it('renders total outgoing with 2 currencies', () => {
    const props: FeesPreviewData = {
      ...defaultProps,
      totalOutgoing: {
        primary: [{ amount: '0.5466', currency: 'ETH' }],
        fees: { amount: '3.50', currency: 'USDC' },
        fiatTotal: '$1,068.00',
      },
    }

    render(<FeesPreview {...props} />)

    expect(screen.getByText('0.5466 ETH')).toBeInTheDocument()
    expect(screen.getByText('3.50 USDC')).toBeInTheDocument()
  })

  it('renders skeleton when loading', () => {
    render(<FeesPreview {...defaultProps} loading />)

    expect(screen.getByText('Max gas fee')).toBeInTheDocument()
    expect(screen.queryByText('0.0002733 ETH')).not.toBeInTheDocument()
  })

  it('renders "Cannot estimate" when error', () => {
    render(<FeesPreview {...defaultProps} error />)

    expect(screen.getByText('Cannot estimate')).toBeInTheDocument()
  })

  it('shows skeleton over error when both loading and error', () => {
    render(<FeesPreview {...defaultProps} loading error />)

    expect(screen.queryByText('Cannot estimate')).not.toBeInTheDocument()
  })

  describe('fallback EOA (canCoverFees: false)', () => {
    const fallbackProps: FeesPreviewData = {
      canCoverFees: false,
      executionFee: { label: 'Execution fee', isFree: true },
      gasFee: { label: 'Max gas fee', amount: '0.0002733', currency: 'ETH' },
    }

    it('does not render payment source selector', () => {
      render(<FeesPreview {...fallbackProps} />)

      expect(screen.queryByText('Pay fees from:')).not.toBeInTheDocument()
      expect(screen.queryByTestId('payment-source-selector')).not.toBeInTheDocument()
    })

    it('renders fee rows', () => {
      render(<FeesPreview {...fallbackProps} />)

      expect(screen.getByText('FREE')).toBeInTheDocument()
      expect(screen.getByText('Max gas fee')).toBeInTheDocument()
    })

    it('renders signer fallback notice', () => {
      render(<FeesPreview {...fallbackProps} />)

      expect(screen.getByText(/Fees will be paid from the signer/)).toBeInTheDocument()
      expect(screen.getByText(/Fees can.*t currently be paid from your Safe/)).toBeInTheDocument()
    })

    it('does not render total outgoing', () => {
      render(<FeesPreview {...fallbackProps} />)

      expect(screen.queryByText('Total outgoing')).not.toBeInTheDocument()
    })

    it('always renders the chain native currency when no availableGasTokens', () => {
      render(<FeesPreview {...fallbackProps} availableGasTokens={undefined} />)

      const notice = screen.getByText(/Fees will be paid from the signer/).parentElement
      expect(notice).toHaveTextContent('ETH')
    })

    it('does not surface a Safe ERC-20 candidate as the signer-pays token', () => {
      const props: FeesPreviewData = {
        ...fallbackProps,
        availableGasTokens: [{ address: '0xUSDC', symbol: 'USDC', logoUri: '' }],
      }
      render(<FeesPreview {...props} />)

      const notice = screen.getByText(/Fees will be paid from the signer/).parentElement
      expect(notice).toHaveTextContent('ETH')
      expect(notice).not.toHaveTextContent('USDC')
    })
  })

  describe('insufficient Safe balance warning (Safe-pays)', () => {
    it('renders the warning when safeHasEnoughGas is false', () => {
      render(<FeesPreview {...defaultProps} safeHasEnoughGas={false} />)

      expect(screen.getByText(/Insufficient .* balance to cover the gas fee/)).toBeInTheDocument()
      expect(screen.getByText(/Top up before execution/)).toBeInTheDocument()
    })

    it('does not render the warning when safeHasEnoughGas is true', () => {
      render(<FeesPreview {...defaultProps} safeHasEnoughGas />)

      expect(screen.queryByText(/Insufficient .* balance to cover the gas fee/)).not.toBeInTheDocument()
    })

    it('does not render the warning when safeHasEnoughGas is undefined (non-Safe-pays paths)', () => {
      render(<FeesPreview {...defaultProps} />)

      expect(screen.queryByText(/Insufficient .* balance to cover the gas fee/)).not.toBeInTheDocument()
    })

    it('does not render the warning while loading (avoids a flash before data arrives)', () => {
      render(<FeesPreview {...defaultProps} safeHasEnoughGas={false} loading />)

      expect(screen.queryByText(/Insufficient .* balance to cover the gas fee/)).not.toBeInTheDocument()
    })
  })
})
