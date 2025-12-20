/**
 * Custom Cypress commands for testing Shell + Account App iframe integration
 */

/**
 * Get the Account App iframe's document body
 * @example cy.getAccountAppIframe().find('.some-selector')
 */
Cypress.Commands.add('getAccountAppIframe', () => {
  return cy
    .get('iframe[data-testid="account-app-iframe"], iframe')
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(cy.wrap)
})

/**
 * Wait for the Account App to send APP_READY message
 * @param {number} timeout - Max wait time in ms (default: 10000)
 * @example cy.waitForAccountApp()
 */
Cypress.Commands.add('waitForAccountApp', (timeout = 10000) => {
  const startTime = Date.now()
  let appReady = false

  // Listen for postMessage from iframe
  cy.window().then((win) => {
    const messageHandler = (event) => {
      const msg = event.data
      if (msg.source === 'safe-account-app' && msg.payload && msg.payload.type === 'APP_READY') {
        appReady = true
        win.removeEventListener('message', messageHandler)
      }
    }
    win.addEventListener('message', messageHandler)
  })

  // Poll until APP_READY received or timeout
  cy.wrap(null).should(() => {
    if (!appReady && Date.now() - startTime > timeout) {
      throw new Error('Account app did not send APP_READY within timeout')
    }
    if (!appReady) {
      throw new Error('Waiting for APP_READY')
    }
  })
})

/**
 * Send a message to the Account App iframe
 * @param {object} message - Message payload to send
 * @example cy.sendMessageToAccountApp({ type: 'WALLET_STATE_CHANGED', payload: {...} })
 */
Cypress.Commands.add('sendMessageToAccountApp', (message) => {
  cy.get('iframe[data-testid="account-app-iframe"], iframe').then(($iframe) => {
    const iframeWindow = $iframe[0].contentWindow
    if (!iframeWindow) {
      throw new Error('Cannot access iframe window')
    }

    iframeWindow.postMessage(
      {
        source: 'safe-shell',
        version: '1.0.0',
        payload: message,
      },
      '*',
    )
  })
})

/**
 * Wait for a specific message from the Account App
 * @param {string} messageType - The message type to wait for
 * @param {number} timeout - Max wait time in ms (default: 10000)
 * @returns {Promise} Resolves with the message payload
 * @example cy.waitForAccountAppMessage('NAVIGATION_CHANGED').then((payload) => {...})
 */
Cypress.Commands.add('waitForAccountAppMessage', (messageType, timeout = 10000) => {
  return cy.window().then((win) => {
    return new Cypress.Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        win.removeEventListener('message', messageHandler)
        reject(new Error(`Message ${messageType} not received within ${timeout}ms`))
      }, timeout)

      const messageHandler = (event) => {
        const msg = event.data
        if (msg.source === 'safe-account-app' && msg.payload && msg.payload.type === messageType) {
          clearTimeout(timeoutId)
          win.removeEventListener('message', messageHandler)
          resolve(msg.payload)
        }
      }

      win.addEventListener('message', messageHandler)
    })
  })
})

/**
 * Visit a route that should load the Account App in an iframe
 * @param {string} path - The path to visit
 * @param {string} safeAddress - The Safe address (format: chain:0x...)
 * @example cy.visitWithAccountApp('/home', 'eth:0xABC...')
 */
Cypress.Commands.add('visitWithAccountApp', (path, safeAddress) => {
  cy.visit(`${path}?safe=${safeAddress}`)
  cy.waitForAccountApp()
})
