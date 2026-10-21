// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import '@testing-library/cypress/add-commands'
import './commands'
import './safe-apps-commands'
import './safes/isolated'
import * as constants from './constants'
import * as ls from './localstorage_data'
import { setWalletCredentials } from './credentials'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Argos visual regression — no-op when ARGOS_TOKEN is absent
import '@argos-ci/cypress/support'

const beamer = JSON.parse(Cypress.expose('BEAMER_DATA_E2E') || '{}')
const productID = beamer.PRODUCT_ID

Cypress.on('test:before:run', () => {
  Cypress.automation('remote:debugger:protocol', {
    command: 'Emulation.setLocaleOverride',
    params: {
      locale: 'en-US',
    },
  })
})

// One browser runs all specs of a shard, so the app's IndexedDB, caches and service workers would carry over.
before(() => {
  if (!Cypress.isBrowser({ family: 'chromium' })) return
  const origin = new URL(Cypress.config('baseUrl')).origin
  cy.wrap(
    Cypress.automation('remote:debugger:protocol', {
      command: 'Storage.clearDataForOrigin',
      params: { origin, storageTypes: 'all' },
    }),
    { log: false },
  )
})

// Isolated runs receive their generated owners with the scenario instead.
if (!Cypress.expose('SAFE_E2E_ISOLATED')) {
  before(() => {
    cy.env(['CYPRESS_WALLET_CREDENTIALS']).then(({ CYPRESS_WALLET_CREDENTIALS }) => {
      if (!CYPRESS_WALLET_CREDENTIALS) throw new Error('Set CYPRESS_WALLET_CREDENTIALS to run the staging specs')
      setWalletCredentials(JSON.parse(CYPRESS_WALLET_CREDENTIALS))
    })
  })
}

before(() => {
  Cypress.on('uncaught:exception', (err, runnable) => {
    return false
  })
  cy.on('log:added', (ev) => {
    if (Cypress.config('hideXHR')) {
      const app = window.top
      if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
        const style = app.document.createElement('style')
        style.innerHTML = '.command-name-request, .command-name-xhr { display: none }'
        style.setAttribute('data-hide-command-log-request', '')
        app.document.head.appendChild(style)
      }
    }
    const originalConsoleLog = console.log
    console.log = (...args) => {
      if (typeof args[0] === 'string' && !args[0].includes('Intercepted request with headers')) {
        originalConsoleLog(...args)
      }
    }
  })
})

beforeEach(() => {
  cy.setupInterceptors()
  cy.clearAllSessionStorage()
  cy.clearLocalStorage()
  cy.clearCookies()

  cy.window().then((window) => {
    const getDate = () => new Date().toISOString()
    const beamerKey1 = `_BEAMER_FIRST_VISIT_${productID}`
    const beamerKey2 = `_BEAMER_BOOSTED_ANNOUNCEMENT_DATE_${productID}`
    const cookiesKey = 'SAFE_v2__cookies_terms'
    const safeLabsTermsKey = 'SAFE_v2__safe-labs-terms'
    const outreachWindowKey = 'SAFE_v2__outreachPopup_session_v2'
    window.localStorage.setItem(beamerKey1, getDate())
    window.localStorage.setItem(beamerKey2, getDate())
    window.localStorage.setItem(cookiesKey, ls.cookies.acceptedCookies)
    window.localStorage.setItem(safeLabsTermsKey, ls.safeLabsTerms.acceptedTerms)
    window.localStorage.setItem(
      constants.localStorageKeys.SAFE_v2__SafeApps__infoModal,
      ls.appPermissions(constants.safeTestAppurl).infoModalAccepted,
    )
    window.localStorage.setItem(
      constants.localStorageKeys.SAFE_v2__safeProAnnouncementSeen,
      ls.safeProAnnouncement.seen,
    )
    window.sessionStorage.setItem(outreachWindowKey, Date.now())
    cy.wrap(window.localStorage).invoke('getItem', cookiesKey).should('equal', ls.cookies.acceptedCookies)
  })
})

// After each visual test, capture Argos screenshot.
const argosCSS = '* { scrollbar-width: none !important; } ::-webkit-scrollbar { display: none !important; }'

afterEach(() => {
  const isVisualTest = Cypress.spec.relative.includes('/visual/')
  if (!isVisualTest) return

  // capture: 'viewport' avoids full-page scroll stitching which duplicates sticky elements
  cy.argosScreenshot(Cypress.currentTest.titlePath.join(' > '), { argosCSS, capture: 'viewport' })
})
