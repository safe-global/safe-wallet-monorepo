/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Get the Account App iframe's document body
     * @example cy.getAccountAppIframe().find('.some-selector')
     */
    getAccountAppIframe(): Chainable<JQuery<HTMLBodyElement>>

    /**
     * Wait for the Account App to send APP_READY message
     * @param timeout - Max wait time in ms (default: 10000)
     * @example cy.waitForAccountApp()
     */
    waitForAccountApp(timeout?: number): Chainable<void>

    /**
     * Send a message to the Account App iframe
     * @param message - Message payload to send
     * @example cy.sendMessageToAccountApp({ type: 'WALLET_STATE_CHANGED', payload: {...} })
     */
    sendMessageToAccountApp(message: object): Chainable<void>

    /**
     * Wait for a specific message from the Account App
     * @param messageType - The message type to wait for
     * @param timeout - Max wait time in ms (default: 10000)
     * @returns Resolves with the message payload
     * @example cy.waitForAccountAppMessage('NAVIGATION_CHANGED').then((payload) => {...})
     */
    waitForAccountAppMessage(messageType: string, timeout?: number): Chainable<any>

    /**
     * Visit a route that should load the Account App in an iframe
     * @param path - The path to visit
     * @param safeAddress - The Safe address (format: chain:0x...)
     * @example cy.visitWithAccountApp('/home', 'eth:0xABC...')
     */
    visitWithAccountApp(path: string, safeAddress: string): Chainable<void>
  }
}
