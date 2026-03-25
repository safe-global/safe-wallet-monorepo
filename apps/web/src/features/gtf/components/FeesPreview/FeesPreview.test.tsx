import { render, screen } from '@testing-library/react'
import FeesPreview from './index'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'

const defaultProps: FeesPreviewData = {
  gasFee: { label: 'Gas fee', amount: '0.0002733', currency: 'ETH' },
}

describe('FeesPreview', () => {
  it('renders fees header and gas fee amount', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Fees')).toBeInTheDocument()
    expect(screen.getByText('Gas fee')).toBeInTheDocument()
    expect(screen.getByText('0.0002733 ETH')).toBeInTheDocument()
  })

  it('renders skeleton for gas fee when loading', () => {
    render(<FeesPreview {...defaultProps} loading />)

    expect(screen.getByText('Gas fee')).toBeInTheDocument()
    expect(screen.queryByText('0.0002733 ETH')).not.toBeInTheDocument()
  })
})
