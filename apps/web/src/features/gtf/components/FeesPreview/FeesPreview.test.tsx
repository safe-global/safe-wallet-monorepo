import { screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import FeesPreview from './index'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'

// NOTE: The shadcn migration kept a simplified FeesPreview (gas fee row only).
// Dev's GTF phase-2 UI (payment source selector, gas token selector, total outgoing,
// signer fallback notice, insufficient balance warning) is flagged for re-port —
// see the squashed migration commit 96dd40659. These tests cover the current component.
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
  it('renders the "Fees" header', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Fees')).toBeInTheDocument()
  })

  it('renders the gas fee row with amount and currency', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Max gas fee')).toBeInTheDocument()
    expect(screen.getByText('0.0002733 ETH')).toBeInTheDocument()
  })

  it('renders a skeleton instead of the amount when loading', () => {
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

  it('renders nothing for the amount when it is missing', () => {
    const props: FeesPreviewData = {
      ...defaultProps,
      gasFee: { label: 'Max gas fee' },
    }
    render(<FeesPreview {...props} />)

    expect(screen.getByText('Max gas fee')).toBeInTheDocument()
    expect(screen.queryByText(/ETH/)).not.toBeInTheDocument()
  })
})
