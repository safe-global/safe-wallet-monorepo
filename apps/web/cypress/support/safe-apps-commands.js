import { INFO_MODAL_KEY } from '../e2e/safe-apps/constants'
import safes from '../fixtures/safes/static.js'

const allowedApps = ['https://safe-test-app.com']

Cypress.Commands.add('visitSafeApp', (appUrl) => {
  cy.on('window:before:load', (window) => {
    window.localStorage.setItem(
      INFO_MODAL_KEY,
      JSON.stringify({
        11155111: { consentsAccepted: true, warningCheckedCustomApps: allowedApps },
      }),
    )
  })

  cy.visit(`/apps/open?safe=${safes.SEP_STATIC_SAFE_2}&appUrl=${encodeURIComponent(appUrl)}`, {
    failOnStatusCode: false,
    onBeforeLoad: (win) => {
      win.addEventListener('message', cy.stub().as('safeAppsMessage'))
    },
  })
})
