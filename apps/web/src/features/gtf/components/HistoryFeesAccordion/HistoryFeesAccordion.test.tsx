import { render, screen, fireEvent } from '@testing-library/react'
import HistoryFeesAccordion from './index'
import type { HistoryFeesData } from '../../hooks/useHistoryFeesBreakdown'

const defaultData: HistoryFeesData = {
  totalFee: { amount: '0.005', currency: 'ETH', fiatAmount: '$15.12' },
  executionFee: { label: 'Execution fee (0.5%)', amount: '0.002730', currency: 'ETH', isFree: true },
  gasFee: { label: 'Max gas fee', amount: '0.005', currency: 'ETH', fiatAmount: '$15.12' },
  paidFrom: 'signer',
}

describe('HistoryFeesAccordion', () => {
  it('renders collapsed state with total fee', () => {
    render(<HistoryFeesAccordion data={defaultData} />)

    expect(screen.getByText('Fees')).toBeInTheDocument()
    // MUI Accordion renders details in the DOM even when collapsed
    // so amounts that match both summary and breakdown appear twice
    expect(screen.getAllByText('0.005 ETH').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('$15.12').length).toBeGreaterThanOrEqual(1)
  })

  it('shows summary amount and fiat in collapsed header', () => {
    const data: HistoryFeesData = {
      totalFee: { amount: '0.010', currency: 'ETH', fiatAmount: '$30.00' },
      executionFee: { label: 'Execution fee (0.5%)', amount: '0.002730', currency: 'ETH', isFree: true },
      gasFee: { label: 'Max gas fee', amount: '0.005', currency: 'ETH', fiatAmount: '$15.12' },
      paidFrom: 'signer',
    }

    render(<HistoryFeesAccordion data={data} />)

    expect(screen.getByText('0.010 ETH')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
  })

  it('expands to show fee breakdown on click', () => {
    render(<HistoryFeesAccordion data={defaultData} />)

    fireEvent.click(screen.getByTestId('history-fees-summary'))

    expect(screen.getByText('Execution fee (0.5%)')).toBeInTheDocument()
    expect(screen.getByText('FREE')).toBeInTheDocument()
    expect(screen.getByText('0.002730 ETH')).toBeInTheDocument()
    expect(screen.getByText('Max gas fee')).toBeInTheDocument()
  })

  it('renders execution fee with FREE badge and strikethrough using del element', () => {
    render(<HistoryFeesAccordion data={defaultData} />)
    fireEvent.click(screen.getByTestId('history-fees-summary'))

    const freeText = screen.getByText('FREE')
    expect(freeText).toBeInTheDocument()

    const strikethroughEl = screen.getByText('0.002730 ETH')
    expect(strikethroughEl.tagName).toBe('DEL')
  })

  it('renders gas fee with fiat amount', () => {
    render(<HistoryFeesAccordion data={defaultData} />)
    fireEvent.click(screen.getByTestId('history-fees-summary'))

    expect(screen.getByText('Max gas fee')).toBeInTheDocument()
    // "0.005 ETH" appears both in the summary and the gas fee row
    expect(screen.getAllByText('0.005 ETH')).toHaveLength(2)
  })

  it('hides fiat when not provided', () => {
    const data: HistoryFeesData = {
      ...defaultData,
      totalFee: { amount: '0.005', currency: 'ETH' },
      gasFee: { label: 'Max gas fee', amount: '0.008', currency: 'ETH' },
      paidFrom: 'signer',
    }

    render(<HistoryFeesAccordion data={data} />)

    expect(screen.queryByText('$15.12')).not.toBeInTheDocument()
  })

  it('shows "Paid from the signer" subtitle when paidFrom is signer', () => {
    render(<HistoryFeesAccordion data={{ ...defaultData, paidFrom: 'signer' }} />)
    expect(screen.getByText('Paid from the signer')).toBeInTheDocument()
  })

  it('shows "Paid from the Safe" subtitle when paidFrom is safe', () => {
    render(<HistoryFeesAccordion data={{ ...defaultData, paidFrom: 'safe' }} />)
    expect(screen.getByText('Paid from the Safe')).toBeInTheDocument()
  })

  it('renders non-free execution fee without FREE badge', () => {
    const data: HistoryFeesData = {
      ...defaultData,
      executionFee: { label: 'Execution fee (0.5%)', amount: '0.002730', currency: 'ETH', isFree: false },
    }

    render(<HistoryFeesAccordion data={data} />)
    fireEvent.click(screen.getByTestId('history-fees-summary'))

    expect(screen.queryByText('FREE')).not.toBeInTheDocument()
    expect(screen.getByText('0.002730 ETH')).toBeInTheDocument()
    expect(screen.getByText('0.002730 ETH').tagName).not.toBe('DEL')
  })
})
