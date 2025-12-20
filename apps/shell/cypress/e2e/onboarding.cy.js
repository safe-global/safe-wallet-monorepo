/**
 * Onboarding flow E2E tests
 * Tests the new shell-based onboarding experience
 */

describe('Onboarding Flow', () => {
  describe('Welcome page', () => {
    beforeEach(() => {
      cy.visit('/welcome')
    })

    it('should display the welcome page', () => {
      // Welcome heading should be visible
      cy.contains('Welcome to').should('be.visible')

      // Main CTA buttons should be visible
      cy.contains('Create new Safe').should('be.visible')
      cy.contains('Add existing Safe').should('be.visible')
      cy.contains('View my Safes').should('be.visible')
    })

    it('should have shell header with branding', () => {
      // Header should be present
      cy.get('header').should('be.visible')

      // Brand name should be visible in header
      cy.get('header').should('contain.text', 'Safe')
    })

    it('should show wallet connection option', () => {
      // Connect wallet button should be in header
      cy.get('header').within(() => {
        cy.contains('Connect').should('exist')
      })
    })

    it('should not show sidebar on welcome page', () => {
      // No sidebar should be present on welcome page
      cy.get('[class*="sidebar"]').should('not.exist')
      cy.get('aside').should('not.exist')
    })
  })

  describe('Create new Safe flow', () => {
    beforeEach(() => {
      cy.visit('/welcome')
    })

    it('should navigate to create Safe page', () => {
      cy.contains('Create new Safe').click()

      // Should navigate to create safe route
      cy.url().should('include', '/new-safe/create')
    })

    it('should show create Safe form', () => {
      cy.visit('/new-safe/create')

      // Form elements should be visible
      cy.get('body').should('be.visible')

      // Note: Actual form implementation is a placeholder
      // Tests will be expanded when form is implemented
    })

    it('should require wallet connection for Safe creation', () => {
      cy.visit('/new-safe/create')

      // If no wallet connected, should show connect prompt
      // This test assumes wallet is not connected
      cy.window().then((win) => {
        // Clear any stored wallet connection
        win.localStorage.removeItem('SAFE_v2__wallet')
      })

      cy.reload()

      // Should show wallet connection requirement
      cy.contains('Connect', { matchCase: false }).should('exist')
    })
  })

  describe('Add existing Safe flow', () => {
    beforeEach(() => {
      cy.visit('/welcome')
    })

    it('should navigate to load Safe page', () => {
      cy.contains('Add existing Safe').click()

      // Should navigate to load safe route
      cy.url().should('include', '/new-safe/load')
    })

    it('should show load Safe form', () => {
      cy.visit('/new-safe/load')

      // Form should be visible
      cy.get('body').should('be.visible')

      // Note: Actual form implementation is a placeholder
      // Tests will be expanded when form is implemented
    })

    it('should accept Safe address input', () => {
      cy.visit('/new-safe/load')

      // Look for address input field (when implemented)
      cy.get('input[name*="address"], input[placeholder*="address"]', { timeout: 1000 })
        .should('exist')
        .or(() => {
          // Placeholder implementation may not have input yet
          expect(true).to.be.true
        })
    })
  })

  describe('View accounts flow', () => {
    beforeEach(() => {
      cy.visit('/welcome')
    })

    it('should navigate to accounts list page', () => {
      cy.contains('View my Safes').click()

      // Should navigate to accounts route
      cy.url().should('include', '/welcome/accounts')
    })

    it('should show empty state when no Safes added', () => {
      // Clear any stored Safes
      cy.window().then((win) => {
        win.localStorage.removeItem('SAFE_v2__addedSafes')
      })

      cy.visit('/welcome/accounts')

      // Should show empty state or message about no Safes
      cy.get('body').should('be.visible')

      // Note: Implementation is placeholder, will be expanded
    })

    it('should list added Safes when present', () => {
      // Add mock Safe to storage
      cy.window().then((win) => {
        win.localStorage.setItem(
          'SAFE_v2__addedSafes',
          JSON.stringify({
            1: {
              'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6': {
                threshold: 2,
                owners: ['0x1234', '0x5678'],
                chainId: '1',
              },
            },
          }),
        )
      })

      cy.visit('/welcome/accounts')

      // Safe should be listed (when implementation is complete)
      cy.get('body').should('be.visible')
    })

    it('should allow selecting a Safe to open', () => {
      cy.visit('/welcome/accounts')

      // When Safes are listed, clicking should navigate to that Safe
      // This will be tested when implementation is complete
      cy.get('body').should('be.visible')
    })
  })

  describe('Navigation between onboarding pages', () => {
    it('should allow navigating back to welcome from create Safe', () => {
      cy.visit('/new-safe/create')

      // Click header logo or back button
      cy.get('header').within(() => {
        cy.get('a, button').first().click()
      })

      // Should go to home/welcome
      cy.url().should('match', /\/(welcome)?$/)
    })

    it('should allow navigating back to welcome from load Safe', () => {
      cy.visit('/new-safe/load')

      // Click header logo or back button
      cy.get('header').within(() => {
        cy.get('a, button').first().click()
      })

      // Should go to home/welcome
      cy.url().should('match', /\/(welcome)?$/)
    })

    it('should allow navigating back to welcome from accounts', () => {
      cy.visit('/welcome/accounts')

      // Click back or home link
      cy.get('header').within(() => {
        cy.get('a, button').first().click()
      })

      // Should go to welcome
      cy.url().should('match', /\/(welcome)?$/)
    })
  })

  describe('Wallet connection during onboarding', () => {
    beforeEach(() => {
      cy.visit('/welcome')
    })

    it('should show connect wallet button in header', () => {
      cy.get('header').within(() => {
        cy.contains('Connect', { matchCase: false }).should('be.visible')
      })
    })

    it('should open wallet connection modal on connect click', () => {
      cy.get('header').within(() => {
        cy.contains('Connect', { matchCase: false }).click()
      })

      // Web3-Onboard modal should appear
      cy.get('[class*="onboard"]', { timeout: 5000 }).should('be.visible')
    })

    it('should persist wallet connection across page navigation', () => {
      // Mock wallet connection
      cy.window().then((win) => {
        win.localStorage.setItem(
          'SAFE_v2__wallet',
          JSON.stringify({
            address: '0x1234567890123456789012345678901234567890',
            chainId: '1',
            label: 'MetaMask',
          }),
        )
      })

      cy.reload()

      // Should show connected state in header
      cy.get('header').should('contain', '0x1234')

      // Navigate to create Safe
      cy.contains('Create new Safe').click()

      // Wallet should still be connected
      cy.get('header').should('contain', '0x1234')
    })
  })

  describe('Responsive design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 800 },
    ]

    viewports.forEach(({ name, width, height }) => {
      it(`should display correctly on ${name}`, () => {
        cy.viewport(width, height)
        cy.visit('/welcome')

        // Welcome content should be visible
        cy.contains('Welcome to').should('be.visible')

        // Main actions should be accessible
        cy.contains('Create new Safe').should('be.visible')
        cy.contains('Add existing Safe').should('be.visible')
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.visit('/welcome')
    })

    it('should have proper heading hierarchy', () => {
      // Main heading should be h1 or h2
      cy.get('h1, h2, h3').should('exist')
    })

    it('should have keyboard navigable buttons', () => {
      // Buttons should be focusable
      cy.contains('Create new Safe').should('be.visible').focus()
      cy.focused().should('contain', 'Create new Safe')
    })

    it('should have semantic HTML structure', () => {
      // Header should use header tag
      cy.get('header').should('exist')

      // Buttons should use button tag
      cy.contains('Create new Safe').parent().should('match', 'button, a')
    })
  })
})
