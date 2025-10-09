import { render, screen } from '@/tests/test-utils'
import SafeShieldWidget from './index'

describe('SafeShieldWidget', () => {
  it('renders the safe shield widget with correct content', () => {
    render(<SafeShieldWidget />)

    // Check if the main message is present
    expect(
      screen.getByText('Transaction details will be automatically scanned for potential risks and will appear here.'),
    ).toBeInTheDocument()

    // Check if the SecuredBySafe section is rendered
    expect(screen.getByText('Secured by')).toBeInTheDocument()

    // Check if the Safe logo with shield is rendered (should have two mock-icon elements - one small icon and one full logo)
    const mockIcons = document.querySelectorAll('mock-icon')
    expect(mockIcons).toHaveLength(2)
  })
})
