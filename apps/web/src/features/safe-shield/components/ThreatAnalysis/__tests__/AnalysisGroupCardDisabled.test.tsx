import { render, screen } from '@/tests/test-utils'
import { AnalysisGroupCardDisabled } from '../AnalysisGroupCardDisabled'

// Mock the SVG icon
jest.mock('@/public/images/common/lock-small.svg', () => ({
  __esModule: true,
  default: 'lock-icon',
}))

describe('AnalysisGroupCardDisabled', () => {
  describe('Basic Rendering', () => {
    it('should render children text', () => {
      render(<AnalysisGroupCardDisabled>Custom checks</AnalysisGroupCardDisabled>)

      expect(screen.getByText('Custom checks')).toBeInTheDocument()
    })

    it('should render with different text content', () => {
      render(<AnalysisGroupCardDisabled>Threat analysis</AnalysisGroupCardDisabled>)

      expect(screen.getByText('Threat analysis')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <AnalysisGroupCardDisabled>
          <span>First</span>
          <span>Second</span>
        </AnalysisGroupCardDisabled>,
      )

      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })
  })

  describe('Icon Rendering', () => {
    it('should render lock icon', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Test</AnalysisGroupCardDisabled>)

      // LockIcon is an SVGR component (mocked as the <lock-icon> element)
      const lockIcon = container.querySelector('lock-icon')
      expect(lockIcon).toBeInTheDocument()
    })

    it('should render keyboard arrow down icon', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Test</AnalysisGroupCardDisabled>)

      // ChevronDown is a lucide-react icon rendered as a plain <svg>
      const chevron = container.querySelector('svg.lucide-chevron-down')
      expect(chevron).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should render with correct flex layout', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Test content</AnalysisGroupCardDisabled>)

      // Layout uses Tailwind flex utility containers (plain divs)
      const flexContainers = container.querySelectorAll('div.flex')
      expect(flexContainers.length).toBeGreaterThanOrEqual(1)
    })

    it('should have padding applied', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Test</AnalysisGroupCardDisabled>)

      const root = container.firstChild as HTMLElement
      expect(root).toHaveClass('p-3')
    })
  })

  describe('Typography', () => {
    it('should render text with disabled color variant', () => {
      render(<AnalysisGroupCardDisabled>Disabled text</AnalysisGroupCardDisabled>)

      const typography = screen.getByText('Disabled text')
      expect(typography).toBeInTheDocument()
      expect(typography).toHaveAttribute('data-slot', 'typography')
      expect(typography).toHaveClass('text-[var(--color-text-disabled)]')
    })

    it('should use paragraph-small variant for text', () => {
      render(<AnalysisGroupCardDisabled>Test text</AnalysisGroupCardDisabled>)

      const typography = screen.getByText('Test text')
      expect(typography).toHaveAttribute('data-variant', 'paragraph-small')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with proper structure', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Accessible content</AnalysisGroupCardDisabled>)

      expect(screen.getByText('Accessible content')).toBeInTheDocument()
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render semantic HTML structure', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Test</AnalysisGroupCardDisabled>)

      // Should have proper nesting structure
      const root = container.firstChild
      expect(root).toBeInTheDocument()
    })
  })

  describe('Props Forwarding', () => {
    it('should forward data-testid attribute to the root Stack', () => {
      const { container } = render(
        <AnalysisGroupCardDisabled data-testid="test-card">Test content</AnalysisGroupCardDisabled>,
      )

      const rootElement = container.firstChild as HTMLElement
      expect(rootElement).toHaveAttribute('data-testid', 'test-card')
    })

    it('should forward additional HTML attributes', () => {
      const { container } = render(
        <AnalysisGroupCardDisabled data-testid="custom-id" className="custom-class" aria-label="Test label">
          Test content
        </AnalysisGroupCardDisabled>,
      )

      const rootElement = container.firstChild as HTMLElement
      expect(rootElement).toHaveAttribute('data-testid', 'custom-id')
      expect(rootElement).toHaveAttribute('aria-label', 'Test label')
      expect(rootElement).toHaveClass('custom-class')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<AnalysisGroupCardDisabled></AnalysisGroupCardDisabled>)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle numeric children', () => {
      render(<AnalysisGroupCardDisabled>{0}</AnalysisGroupCardDisabled>)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle long text content', () => {
      const longText = 'This is a very long text content that should still render correctly'
      render(<AnalysisGroupCardDisabled>{longText}</AnalysisGroupCardDisabled>)

      expect(screen.getByText(longText)).toBeInTheDocument()
    })
  })
})
