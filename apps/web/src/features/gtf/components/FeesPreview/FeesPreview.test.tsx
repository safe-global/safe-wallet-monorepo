import { render, screen } from '@testing-library/react'
import FeesPreview from './index'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'

const defaultProps: FeesPreviewData = {
  executionFee: { label: 'Execution fee' },
  gasFee: { label: 'Gas fee', amount: '0.0002733', currency: 'ETH' },
}

describe('FeesPreview', () => {
  it('renders fee breakdown with FREE execution fee and gas amount', () => {
    render(<FeesPreview {...defaultProps} />)

    expect(screen.getByText('Fees')).toBeInTheDocument()
    expect(screen.getByText('How fees work')).toBeInTheDocument()
    expect(screen.getByText('Execution fee')).toBeInTheDocument()
    expect(screen.getByText('FREE')).toBeInTheDocument()
    expect(screen.getByText('Gas fee')).toBeInTheDocument()
    expect(screen.getByText('0.0002733 ETH')).toBeInTheDocument()
  })

  it('renders skeleton for gas fee when loading', () => {
    render(<FeesPreview {...defaultProps} loading />)

    expect(screen.getByText('FREE')).toBeInTheDocument()
    expect(screen.getByText('Execution fee')).toBeInTheDocument()
    expect(screen.getByText('Gas fee')).toBeInTheDocument()
    expect(screen.queryByText('0.0002733 ETH')).not.toBeInTheDocument()
  })
})
