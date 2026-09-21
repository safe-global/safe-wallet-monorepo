import { render, screen } from '@/tests/test-utils'
import { VulnerableModuleWarning } from './VulnerableModuleWarning'

describe('VulnerableModuleWarning', () => {
  it('renders nothing when the Safe is not affected', () => {
    const { container } = render(<VulnerableModuleWarning isVulnerable={false} />)
    expect(container.childElementCount).toBe(0)
  })

  it('renders a critical card with a Read more link when the Safe is affected', () => {
    render(<VulnerableModuleWarning isVulnerable />)

    expect(screen.getByText('This Safe is affected by a vulnerable third-party module.')).toBeInTheDocument()
    expect(screen.getByText(/known critical vulnerability/)).toBeInTheDocument()

    const link = screen.getByTestId('read-more-vulnerable-module-btn')
    expect(link).toHaveTextContent('Read more')
    expect(link).toHaveAttribute('href')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
