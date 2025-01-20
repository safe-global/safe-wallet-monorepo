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
import * as constants from './constants'
import * as ls from './localstorage_data'
import { acceptCookies2 } from '../e2e/pages/main.page'

// Alternatively you can use CommonJS syntax:
// require('./commands')

/*
 FIXME: The terms banner is being displayed depending on the cookie banner local storage state.
  However, in cypress the cookie banner state is evaluated after the banner has been dismissed not before
  which displays the terms banner even though it shouldn't so we need to globally hide it in our tests.
 */
const { addCompareSnapshotCommand } = require('cypress-visual-regression/dist/command')
addCompareSnapshotCommand()

const beamer = JSON.parse(Cypress.env('BEAMER_DATA_E2E') || '{}')
const productID = beamer.PRODUCT_ID

Cypress.on('test:before:run', () => {
  Cypress.automation('remote:debugger:protocol', {
    command: 'Emulation.setLocaleOverride',
    params: {
      locale: 'en-US',
    },
  })
})

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
    window.localStorage.setItem(beamerKey1, getDate())
    window.localStorage.setItem(beamerKey2, getDate())
    window.localStorage.setItem(cookiesKey, ls.cookies.acceptedCookies)
    window.localStorage.setItem(
      constants.localStorageKeys.SAFE_v2__SafeApps__infoModal,
      ls.appPermissions(constants.safeTestAppurl).infoModalAccepted,
    )
    cy.wrap(window.localStorage).invoke('getItem', cookiesKey).should('equal', ls.cookies.acceptedCookies)
  })
  cy.visit(constants.setupUrl + 'sep:0xBb26E3717172d5000F87DeFd391994f789D80aEB')
  acceptCookies2()
})
