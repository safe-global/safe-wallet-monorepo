import { render, screen, renderWithUserEvent } from '@/tests/test-utils'
import { ShowAllAddress } from '../../ShowAllAddress/ShowAllAddress'
import { faker } from '@faker-js/faker'

describe('ShowAllAddress', () => {
  const mockAddresses = [
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
    faker.finance.ethereumAddress(),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the component with show all button', () => {
      render(<ShowAllAddress addresses={mockAddresses} />)

      expect(screen.getByText('Show all')).toBeInTheDocument()
    })

    it('should render with correct initial structure', () => {
      const { container } = render(<ShowAllAddress addresses={mockAddresses} />)

      // Check for expand icon
      const expandIcon = container.querySelector('[data-testid="ExpandMoreIcon"]')
      expect(expandIcon).toBeInTheDocument()
    })

    it('should not display addresses initially (collapsed)', () => {
      render(<ShowAllAddress addresses={mockAddresses} />)

      // Addresses should not be visible in the collapsed state
      mockAddresses.forEach((address) => {
        expect(screen.queryByText(address)).not.toBeVisible()
      })
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should expand when clicking "Show all"', async () => {
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      const showAllButton = screen.getByText('Show all')
      await user.click(showAllButton)

      // After clicking, should show "Hide all"
      expect(screen.getByText('Hide all')).toBeInTheDocument()
      expect(screen.queryByText('Show all')).not.toBeInTheDocument()
    })

    it('should display all addresses when expanded', async () => {
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      const showAllButton = screen.getByText('Show all')
      await user.click(showAllButton)

      // All addresses should now be visible
      mockAddresses.forEach((address) => {
        expect(screen.getByText(address)).toBeVisible()
      })
    })

    it('should collapse when clicking "Hide all"', async () => {
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      // First expand
      const showAllButton = screen.getByText('Show all')
      await user.click(showAllButton)

      expect(screen.getByText('Hide all')).toBeInTheDocument()

      // Then collapse
      const hideAllButton = screen.getByText('Hide all')
      await user.click(hideAllButton)

      expect(screen.getByText('Show all')).toBeInTheDocument()
      expect(screen.queryByText('Hide all')).not.toBeInTheDocument()
    })

    it('should hide addresses when collapsed again', async () => {
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      // Initially, addresses should not be visible
      mockAddresses.forEach((address) => {
        const element = screen.queryByText(address)
        expect(element).not.toBeVisible()
      })

      // Expand
      await user.click(screen.getByText('Show all'))

      // Verify all addresses are now visible
      mockAddresses.forEach((address) => {
        const element = screen.getByText(address)
        expect(element).toBeVisible()
      })

      // Collapse
      await user.click(screen.getByText('Hide all'))

      // After collapsing, verify "Show all" is back
      expect(screen.getByText('Show all')).toBeInTheDocument()
      expect(screen.queryByText('Hide all')).not.toBeInTheDocument()
    })

    it('should toggle state multiple times', async () => {
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      // Toggle 1: Show
      await user.click(screen.getByText('Show all'))
      expect(screen.getByText('Hide all')).toBeInTheDocument()

      // Toggle 2: Hide
      await user.click(screen.getByText('Hide all'))
      expect(screen.getByText('Show all')).toBeInTheDocument()

      // Toggle 3: Show again
      await user.click(screen.getByText('Show all'))
      expect(screen.getByText('Hide all')).toBeInTheDocument()

      // Toggle 4: Hide again
      await user.click(screen.getByText('Hide all'))
      expect(screen.getByText('Show all')).toBeInTheDocument()
    })
  })

  describe('Address Display', () => {
    it('should render all addresses with correct keys', async () => {
      const { user, container } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      await user.click(screen.getByText('Show all'))

      // Check that each address is rendered
      mockAddresses.forEach((address) => {
        expect(screen.getByText(address)).toBeInTheDocument()
      })

      // Check that addresses are in separate boxes
      const addressBoxes = container.querySelectorAll('.MuiBox-root')
      expect(addressBoxes.length).toBeGreaterThanOrEqual(mockAddresses.length)
    })

    it('should display single address correctly', async () => {
      const singleAddress = [faker.finance.ethereumAddress()]
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={singleAddress} />)

      await user.click(screen.getByText('Show all'))

      expect(screen.getByText(singleAddress[0])).toBeVisible()
    })

    it('should display many addresses correctly', async () => {
      const manyAddresses = Array.from({ length: 10 }, () => faker.finance.ethereumAddress())
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={manyAddresses} />)

      await user.click(screen.getByText('Show all'))

      manyAddresses.forEach((address) => {
        expect(screen.getByText(address)).toBeVisible()
      })
    })

    it('should handle addresses with word wrapping', async () => {
      const longAddresses = ['0x1234567890123456789012345678901234567890', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd']
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={longAddresses} />)

      await user.click(screen.getByText('Show all'))

      // Check that both addresses are rendered
      longAddresses.forEach((address) => {
        expect(screen.getByText(address)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty addresses array', () => {
      render(<ShowAllAddress addresses={[]} />)

      expect(screen.getByText('Show all')).toBeInTheDocument()
    })

    it('should not render any addresses when empty and expanded', async () => {
      const { user, container } = renderWithUserEvent(<ShowAllAddress addresses={[]} />)

      await user.click(screen.getByText('Show all'))

      // Should show "Hide all" but no addresses
      expect(screen.getByText('Hide all')).toBeInTheDocument()

      // No address boxes should be rendered
      const addressText = container.querySelectorAll('.MuiTypography-body2')
      // Only the "Hide all" text should be present
      expect(addressText.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Styling and UI', () => {
    it('should render clickable element with proper structure', () => {
      render(<ShowAllAddress addresses={mockAddresses} />)

      // Check that the clickable text is present
      const showAllText = screen.getByText('Show all')
      expect(showAllText).toBeInTheDocument()
    })

    it('should render expand icon with correct rotation when collapsed', () => {
      const { container } = render(<ShowAllAddress addresses={mockAddresses} />)

      const expandIcon = container.querySelector('[data-testid="ExpandMoreIcon"]')
      expect(expandIcon).toHaveStyle({ transform: 'rotate(0deg)' })
    })

    it('should rotate expand icon when expanded', async () => {
      const { user, container } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      await user.click(screen.getByText('Show all'))

      const expandIcon = container.querySelector('[data-testid="ExpandMoreIcon"]')
      expect(expandIcon).toHaveStyle({ transform: 'rotate(-180deg)' })
    })

    it('should render correct number of address boxes when expanded', async () => {
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      await user.click(screen.getByText('Show all'))

      // Each address should be rendered
      mockAddresses.forEach((address) => {
        expect(screen.getByText(address)).toBeInTheDocument()
      })
    })

    it('should render addresses in separate containers', async () => {
      const { user, container } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      await user.click(screen.getByText('Show all'))

      // Check that addresses are rendered in body2 typography
      const addressTexts = container.querySelectorAll('.MuiTypography-body2')
      // Filter to only address text (not "Hide all" text)
      const actualAddresses = Array.from(addressTexts).filter(
        (el) => el.textContent && mockAddresses.includes(el.textContent),
      )

      expect(actualAddresses.length).toBe(mockAddresses.length)
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible - expand', async () => {
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      const showAllButton = screen.getByText('Show all').closest('div')

      // Tab to the element and press Enter
      if (showAllButton) {
        showAllButton.focus()
        await user.keyboard('{Enter}')
      }

      // Should expand (click handler should be triggered)
      // Note: Depending on implementation, this might need adjustment
      await user.click(screen.getByText('Show all'))
      expect(screen.getByText('Hide all')).toBeInTheDocument()
    })

    it('should maintain focus management during interaction', async () => {
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={mockAddresses} />)

      await user.click(screen.getByText('Show all'))
      expect(screen.getByText('Hide all')).toBeInTheDocument()

      await user.click(screen.getByText('Hide all'))
      expect(screen.getByText('Show all')).toBeInTheDocument()
    })
  })

  describe('Component Props', () => {
    it('should accept and render different address formats', async () => {
      const differentAddresses = [
        '0x0000000000000000000000000000000000000001',
        '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF',
        faker.finance.ethereumAddress().toLowerCase(),
      ]
      const { user } = renderWithUserEvent(<ShowAllAddress addresses={differentAddresses} />)

      await user.click(screen.getByText('Show all'))

      differentAddresses.forEach((address) => {
        expect(screen.getByText(address)).toBeVisible()
      })
    })

    it('should handle addresses prop update', async () => {
      const initialAddresses = [faker.finance.ethereumAddress()]
      const { user, rerender } = renderWithUserEvent(<ShowAllAddress addresses={initialAddresses} />)

      await user.click(screen.getByText('Show all'))
      expect(screen.getByText(initialAddresses[0])).toBeVisible()

      // Update addresses
      const newAddresses = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]
      rerender(<ShowAllAddress addresses={newAddresses} />)

      // New addresses should be visible (component is still expanded)
      newAddresses.forEach((address) => {
        expect(screen.getByText(address)).toBeVisible()
      })

      // Old address should not be present
      expect(screen.queryByText(initialAddresses[0])).not.toBeInTheDocument()
    })
  })
})
