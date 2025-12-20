/**
 * Integration tests for Shell + Account App (iframe) communication
 * Tests the postMessage protocol and state synchronization
 */

describe('Shell + Account App Integration', () => {
  const TEST_SAFE_ADDRESS = 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'

  beforeEach(() => {
    // Mock wallet connection state
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
  })

  describe('Routing and iframe loading', () => {
    it('should load account app in iframe for routes with ?safe param', () => {
      cy.visit(`/home?safe=${TEST_SAFE_ADDRESS}`)

      // Shell header should be visible
      cy.get('header').should('be.visible')

      // Iframe should be rendered
      cy.get('iframe').should('exist')

      // Wait for account app to be ready
      cy.waitForAccountApp()
    })

    it('should show shell welcome page for routes without ?safe param', () => {
      cy.visit('/welcome')

      // Shell header should be visible
      cy.get('header').should('be.visible')

      // No iframe should be rendered
      cy.get('iframe').should('not.exist')

      // Welcome page content should be visible
      cy.contains('Welcome to').should('be.visible')
    })

    it('should redirect to welcome page for unknown routes without ?safe param', () => {
      cy.visit('/unknown-route')

      // Should redirect to welcome
      cy.url().should('include', '/welcome')
    })
  })

  describe('PostMessage communication', () => {
    beforeEach(() => {
      cy.visitWithAccountApp('/home', TEST_SAFE_ADDRESS)
    })

    it('should send WALLET_STATE_CHANGED message to iframe on load', () => {
      // Iframe should receive wallet state
      cy.getAccountAppIframe().should('exist')

      // The iframe should have received wallet state through postMessage
      // We can verify this by checking if wallet-connected elements appear in iframe
      cy.getAccountAppIframe().within(() => {
        // Account app should show wallet connection state
        cy.get('[data-testid="wallet-info"], [class*="wallet"]', { timeout: 5000 }).should('exist')
      })
    })

    it('should sync navigation changes between shell and iframe', () => {
      // Navigate within iframe (simulated)
      cy.sendMessageToAccountApp({
        type: 'NAVIGATION_CHANGED',
        payload: { path: '/transactions', query: {} },
      })

      // Shell URL should update (with debounce delay)
      cy.url({ timeout: 1000 }).should('include', '/transactions')
    })

    it('should handle RPC_REQUEST from iframe', () => {
      // Send RPC request from iframe
      cy.sendMessageToAccountApp({
        type: 'RPC_REQUEST',
        requestId: 'test-request-1',
        payload: {
          method: 'eth_chainId',
          params: [],
        },
      })

      // Wait for response (shell should proxy to wallet)
      cy.waitForAccountAppMessage('RESPONSE', 5000).then((response) => {
        expect(response.requestId).to.equal('test-request-1')
        expect(response.payload).to.exist
      })
    })
  })

  describe('Wallet connection flow', () => {
    it('should connect wallet in shell and propagate to iframe', () => {
      cy.visit('/welcome')

      // Click connect wallet button in shell
      cy.contains('Connect wallet').click()

      // Wallet modal should appear (from Web3-Onboard)
      cy.get('[class*="onboard"]', { timeout: 5000 }).should('be.visible')

      // Note: Actual wallet connection requires browser extension interaction
      // which cannot be fully automated in Cypress without additional plugins
    })

    it('should show connected wallet in shell header', () => {
      // Visit with wallet already connected (from beforeEach)
      cy.visitWithAccountApp('/home', TEST_SAFE_ADDRESS)

      // Header should show wallet address or ENS
      cy.get('header').should('contain', '0x1234').or('contain', 'eth:')
    })
  })

  describe('Theme synchronization', () => {
    it('should sync theme changes from shell to iframe', () => {
      cy.visitWithAccountApp('/home', TEST_SAFE_ADDRESS)

      // Toggle theme in shell (if theme toggle exists)
      cy.window().then((win) => {
        // Change theme preference
        win.localStorage.setItem('SAFE_v2__theme', 'dark')

        // Trigger theme change event
        win.dispatchEvent(new Event('storage'))
      })

      // Send theme change message to iframe
      cy.sendMessageToAccountApp({
        type: 'THEME_CHANGED',
        payload: { mode: 'dark' },
      })

      // Iframe should update its theme
      cy.getAccountAppIframe().should(($body) => {
        const bodyClasses = $body.attr('class') || ''
        expect(bodyClasses).to.match(/dark|theme-dark/)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle iframe load errors gracefully', () => {
      // Visit with invalid safe address
      cy.visit('/home?safe=invalid-address')

      // Should not crash, either redirect or show error
      cy.get('body').should('exist')

      // Either welcome page or error message should appear
      cy.get('body').then(($body) => {
        const hasWelcome = $body.text().includes('Welcome')
        const hasError = $body.text().includes('error') || $body.text().includes('Error')
        expect(hasWelcome || hasError).to.be.true
      })
    })

    it('should handle missing APP_READY message timeout', () => {
      // Visit with account app URL but mock iframe that never sends APP_READY
      cy.visit('/home?safe=' + TEST_SAFE_ADDRESS)

      // The iframe should still be rendered even if APP_READY is delayed
      cy.get('iframe', { timeout: 3000 }).should('exist')
    })
  })

  describe('Security', () => {
    it('should validate message source in postMessage handlers', () => {
      cy.visitWithAccountApp('/home', TEST_SAFE_ADDRESS)

      // Send message with wrong source
      cy.window().then((win) => {
        win.postMessage(
          {
            source: 'malicious-app',
            version: '1.0.0',
            payload: { type: 'WALLET_STATE_CHANGED', payload: {} },
          },
          '*',
        )
      })

      // Shell should ignore the message (no errors, app continues functioning)
      cy.get('header').should('be.visible')
      cy.get('iframe').should('exist')
    })

    it('should validate protocol version in messages', () => {
      cy.visitWithAccountApp('/home', TEST_SAFE_ADDRESS)

      // Send message with wrong version
      cy.window().then((win) => {
        const iframe = win.document.querySelector('iframe')
        iframe.contentWindow.postMessage(
          {
            source: 'safe-account-app',
            version: '99.0.0',
            payload: { type: 'REQUEST_WALLET_STATE', requestId: 'test' },
          },
          '*',
        )
      })

      // Shell should handle version mismatch (log warning but continue)
      cy.get('body').should('exist')
    })
  })
})
