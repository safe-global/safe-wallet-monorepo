import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { showTrezorHashComparison, hideTrezorHashComparison } from '../../store'
import TrezorHashComparison from './index'

describe('TrezorHashComparison', () => {
  beforeEach(() => {
    hideTrezorHashComparison()
  })

  it('should not render when no hash present', () => {
    const { container } = render(<TrezorHashComparison />)
    expect(container.firstChild).toBeNull()
  })

  it('should render dialog when hash present', () => {
    showTrezorHashComparison('0xabc123')
    render(<TrezorHashComparison />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should display transaction hash', () => {
    const hash = '0xabc123def456'
    showTrezorHashComparison(hash)
    render(<TrezorHashComparison />)
    expect(screen.getByText(/abc123/i)).toBeInTheDocument()
  })

  it('should close dialog when close button clicked', async () => {
    showTrezorHashComparison('0xtest')
    const { container } = render(<TrezorHashComparison />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)

    expect(container.firstChild).toBeNull()
  })
})
