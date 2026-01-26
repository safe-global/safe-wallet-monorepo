import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { showLedgerHashComparison, hideLedgerHashComparison } from '../../store'
import LedgerHashComparison from './index'

describe('LedgerHashComparison', () => {
  beforeEach(() => {
    hideLedgerHashComparison()
  })

  it('should not render when no hash present', () => {
    const { container } = render(<LedgerHashComparison />)
    expect(container.firstChild).toBeNull()
  })

  it('should render dialog when hash present', () => {
    showLedgerHashComparison('0xabc123')
    render(<LedgerHashComparison />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should display transaction hash', () => {
    const hash = '0xabc123def456'
    showLedgerHashComparison(hash)
    render(<LedgerHashComparison />)
    // HexEncodedData component will display the hash
    expect(screen.getByText(new RegExp('abc123', 'i'))).toBeInTheDocument()
  })

  it('should close dialog when close button clicked', async () => {
    showLedgerHashComparison('0xtest')
    const { container } = render(<LedgerHashComparison />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)

    // After clicking close, component should render null
    expect(container.firstChild).toBeNull()
  })
})
