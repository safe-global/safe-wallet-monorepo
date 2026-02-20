import React from 'react'
import { render, screen, renderWithUserEvent } from '@/tests/test-utils'
import { AnalysisDetailsDropdown } from '../AnalysisDetailsDropdown'
import { Box } from '@mui/material'

describe('AnalysisDetailsDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the component with default "Show all" label', () => {
      render(
        <AnalysisDetailsDropdown>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      expect(screen.getByText('Show all')).toBeInTheDocument()
    })

    it('should render with custom labels', () => {
      render(
        <AnalysisDetailsDropdown showLabel="Show details" hideLabel="Hide details">
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      expect(screen.getByText('Show details')).toBeInTheDocument()
    })

    it('should render with correct initial structure', () => {
      const { container } = render(
        <AnalysisDetailsDropdown>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      const expandIcon = container.querySelector('[data-testid="ExpandMoreIcon"]')
      expect(expandIcon).toBeInTheDocument()
    })

    it('should not display content initially (collapsed)', () => {
      render(
        <AnalysisDetailsDropdown>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      const content = screen.getByText('Test content')
      expect(content).toBeInTheDocument()
      expect(content).not.toBeVisible()
    })

    it('should display content when defaultExpanded is true', () => {
      render(
        <AnalysisDetailsDropdown defaultExpanded>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      expect(screen.getByText('Hide all')).toBeInTheDocument()
      const content = screen.getByText('Test content')
      expect(content).toBeVisible()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should expand when clicking "Show all"', async () => {
      const { user } = renderWithUserEvent(
        <AnalysisDetailsDropdown>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      const showAllButton = screen.getByText('Show all')
      await user.click(showAllButton)

      expect(screen.getByText('Hide all')).toBeInTheDocument()
      expect(screen.queryByText('Show all')).not.toBeInTheDocument()
    })

    it('should display content when expanded', async () => {
      const { user } = renderWithUserEvent(
        <AnalysisDetailsDropdown>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      const showAllButton = screen.getByText('Show all')
      await user.click(showAllButton)

      // Content should now be visible
      const content = screen.getByText('Test content')
      expect(content).toBeVisible()
    })

    it('should collapse when clicking "Hide all"', async () => {
      const { user } = renderWithUserEvent(
        <AnalysisDetailsDropdown>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      const showAllButton = screen.getByText('Show all')
      await user.click(showAllButton)

      expect(screen.getByText('Hide all')).toBeInTheDocument()

      const hideAllButton = screen.getByText('Hide all')
      await user.click(hideAllButton)

      expect(screen.getByText('Show all')).toBeInTheDocument()
      expect(screen.queryByText('Hide all')).not.toBeInTheDocument()
    })

    it('should hide content when collapsed again', async () => {
      const { user } = renderWithUserEvent(
        <AnalysisDetailsDropdown>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      const content = screen.getByText('Test content')
      expect(content).toBeInTheDocument()

      await user.click(screen.getByText('Show all'))

      expect(content).toBeVisible()
      expect(screen.getByText('Hide all')).toBeInTheDocument()

      await user.click(screen.getByText('Hide all'))

      // After collapsing, verify "Show all" is back
      expect(screen.getByText('Show all')).toBeInTheDocument()
      expect(screen.queryByText('Hide all')).not.toBeInTheDocument()
    })

    it('should work with custom labels', async () => {
      const { user } = renderWithUserEvent(
        <AnalysisDetailsDropdown showLabel="Show details" hideLabel="Hide details">
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      expect(screen.getByText('Show details')).toBeInTheDocument()

      await user.click(screen.getByText('Show details'))

      expect(screen.getByText('Hide details')).toBeInTheDocument()
      expect(screen.queryByText('Show details')).not.toBeInTheDocument()
    })
  })

  describe('Content Wrapper', () => {
    it('should apply contentWrapper when provided', () => {
      const contentWrapper = (children: React.ReactNode) => (
        <Box data-testid="wrapped-content" sx={{ padding: 2 }}>
          {children}
        </Box>
      )

      render(
        <AnalysisDetailsDropdown contentWrapper={contentWrapper} defaultExpanded>
          <div>Test content</div>
        </AnalysisDetailsDropdown>,
      )

      expect(screen.getByTestId('wrapped-content')).toBeInTheDocument()
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should not apply wrapper when contentWrapper is not provided', () => {
      render(
        <AnalysisDetailsDropdown defaultExpanded>
          <div data-testid="unwrapped-content">Test content</div>
        </AnalysisDetailsDropdown>,
      )

      expect(screen.getByTestId('unwrapped-content')).toBeInTheDocument()
    })
  })
})
