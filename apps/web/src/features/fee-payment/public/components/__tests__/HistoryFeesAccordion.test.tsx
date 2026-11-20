import { render, screen } from '@testing-library/react'
import { useHasFeature } from '@/hooks/useChains'
import type { HistoryFeesData } from '@/features/fee-payment/public/hooks/useHistoryFeesBreakdown'
import HistoryFeesAccordion from '../HistoryFeesAccordion'

jest.mock('@/hooks/useChains')

const SIGNER_PAID: HistoryFeesData = {
  totalFee: { amount: '0.0001', currency: 'ETH' },
  executionFee: { label: 'Execution fee', isFree: true },
  gasFee: { label: 'Max gas fee', amount: '0.0001', currency: 'ETH' },
  paidFrom: 'signer',
}

describe('HistoryFeesAccordion', () => {
  it('renders who paid the fees on a chain without any feature flag', async () => {
    jest.mocked(useHasFeature).mockReturnValue(false)

    render(<HistoryFeesAccordion data={SIGNER_PAID} />)

    expect(await screen.findByText('Paid from signer wallet')).toBeInTheDocument()
  })
})
