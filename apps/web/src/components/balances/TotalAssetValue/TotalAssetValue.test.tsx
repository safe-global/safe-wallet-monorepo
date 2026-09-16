import { render } from '@testing-library/react'
import TotalAssetValue from '.'

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({ safe: { deployed: true } })),
}))
jest.mock('@/hooks/useVisibleBalances', () => ({
  useVisibleBalances: jest.fn(() => ({ balances: { items: [] } })),
}))
jest.mock('@/hooks/useNativeTokenDisplay', () => ({
  useNativeTokenDisplay: jest.fn(() => ({ showUndeployedNativeValue: false })),
}))
jest.mock('@/store', () => ({ useAppSelector: jest.fn(() => 'USD') }))
jest.mock('@/store/settingsSlice', () => ({ selectCurrency: jest.fn() }))

describe('TotalAssetValue', () => {
  it('shows -- when error is set (deployed safe)', () => {
    const { getByText } = render(<TotalAssetValue fiatTotal={0} error />)
    expect(getByText('--')).toBeInTheDocument()
  })

  it('shows $0.00 for a successful zero balance (no error)', () => {
    const { container, queryByText } = render(<TotalAssetValue fiatTotal={0} />)
    expect(queryByText('--')).not.toBeInTheDocument()
    expect(container.textContent).toContain('0.00')
  })

  it('shows a "could not load" subtitle when error and showErrorSubtitle are set', () => {
    const { getByText } = render(<TotalAssetValue fiatTotal={0} error showErrorSubtitle />)
    expect(getByText(/couldn't load your balance/i)).toBeInTheDocument()
  })

  it('does not show the subtitle when error is set but showErrorSubtitle is not', () => {
    const { queryByText } = render(<TotalAssetValue fiatTotal={0} error />)
    expect(queryByText(/couldn't load your balance/i)).not.toBeInTheDocument()
  })

  it('does not show the subtitle without an error', () => {
    const { queryByText } = render(<TotalAssetValue fiatTotal={0} showErrorSubtitle />)
    expect(queryByText(/couldn't load your balance/i)).not.toBeInTheDocument()
  })
})
