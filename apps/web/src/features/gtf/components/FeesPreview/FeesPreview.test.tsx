import { render, screen, fireEvent } from '@testing-library/react'
import FeesPreview from './index'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'

const defaultProps: FeesPreviewData = {
  canCoverFees: true,
  executionFee: { label: 'Execution fee (0.05%)', amount: '0.02733', currency: 'ETH', isFree: true },
  gasFee: { label: 'Gas fee', amount: '0.0002733', currency: 'ETH', fiatAmount: '$97.30' },
  totalOutgoing: { primary: { amount: '0.60126', currency: 'ETH' }, fiatTotal: '$1,768.85' },
  availableGasTokens: [{ symbol: 'ETH', logoUri: '' }],
  selectedGasToken: 'ETH',
  onGasTokenChange: jest.fn(),
}

describe('FeesPreview', () => {
  it('renders "Fees" header and "How fees work" link', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Fees')).toBeInTheDocument()
    expect(screen.getByText(/How fees work/)).toBeInTheDocument()
  })

  it('renders payment source toggle with Safe wallet active by default', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Pay fees from')).toBeInTheDocument()
    expect(screen.getByText('Safe wallet')).toBeInTheDocument()
    expect(screen.getByText('Signing wallet')).toBeInTheDocument()
    expect(screen.getByText('using')).toBeInTheDocument()
  })

  it('renders gas token selector', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('ETH')).toBeInTheDocument()
  })

  it('renders execution fee as FREE with strikethrough', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('FREE')).toBeInTheDocument()
    expect(screen.getByText('0.02733 ETH')).toBeInTheDocument()
  })

  it('renders gas fee with fiat', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Gas fee')).toBeInTheDocument()
    expect(screen.getByText('$97.30')).toBeInTheDocument()
  })

  it('renders total outgoing when Safe wallet selected', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Total outgoing')).toBeInTheDocument()
    expect(screen.getByText('0.60126 ETH')).toBeInTheDocument()
    expect(screen.getByText('$1,768.85')).toBeInTheDocument()
  })

  it('shows total outgoing when Signing wallet selected', () => {
    render(<FeesPreview {...defaultProps} />)

    fireEvent.click(screen.getByText('Signing wallet'))

    expect(screen.getByText('Total outgoing')).toBeInTheDocument()
  })

  it('renders total outgoing with 2 currencies', () => {
    const props: FeesPreviewData = {
      ...defaultProps,
      totalOutgoing: {
        primary: { amount: '0.5466', currency: 'ETH' },
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

    expect(screen.getByText('Gas fee')).toBeInTheDocument()
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
})
