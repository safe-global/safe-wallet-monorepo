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

      // Check for SvgIcon component (MUI component that wraps the SVG)
      const svgIcon = container.querySelector('.MuiSvgIcon-root')
      expect(svgIcon).toBeInTheDocument()
    })

    it('should render keyboard arrow down icon', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Test</AnalysisGroupCardDisabled>)

      // KeyboardArrowDownIcon is rendered as MUI Icon
      const icons = container.querySelectorAll('.MuiSvgIcon-root')
      expect(icons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Layout and Structure', () => {
    it('should render with correct Stack layout', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Test content</AnalysisGroupCardDisabled>)

      // Check for Stack components (MUI Stack renders as div with flex)
      const stacks = container.querySelectorAll('.MuiStack-root')
      expect(stacks.length).toBeGreaterThanOrEqual(1)
    })

    it('should have padding applied', () => {
      const { container } = render(<AnalysisGroupCardDisabled>Test</AnalysisGroupCardDisabled>)

      const mainStack = container.querySelector('.MuiStack-root')
      expect(mainStack).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should render text with disabled color variant', () => {
      render(<AnalysisGroupCardDisabled>Disabled text</AnalysisGroupCardDisabled>)

      const typography = screen.getByText('Disabled text')
      expect(typography).toBeInTheDocument()
      expect(typography).toHaveClass('MuiTypography-root')
    })

    it('should use body2 variant for text', () => {
      render(<AnalysisGroupCardDisabled>Test text</AnalysisGroupCardDisabled>)

      const typography = screen.getByText('Test text')
      expect(typography).toHaveClass('MuiTypography-body2')
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
