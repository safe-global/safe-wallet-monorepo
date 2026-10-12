import { isRemoteBackendHost } from '../../e2e/environment/cypress.mjs'

let LOCAL_STORAGE_MEMORY = {}

Cypress.Commands.add('saveLocalStorageCache', () => {
  Object.keys(localStorage).forEach((key) => {
    LOCAL_STORAGE_MEMORY[key] = localStorage[key]
  })
})

Cypress.Commands.add('restoreLocalStorageCache', () => {
  Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key])
  })
})

/**
 * Wait for a thing by polling for it
 *
 * @param  {(string|function)} item                  - A jQuery selector string or a function that returns a boolean
 * @param  {object}            [options]             - An options object
 * @param  {number}            [options.timeout=200] - The time between tries in milliseconds
 * @param  {number}            [options.tries=300]   - The amount of times to try before failing
 *
 * @return {Promise}                                 - A Cypress promise, more at https://docs.cypress.io/api/utilities/promise.html
 */
const waitForSelector = (item, options = {}) => {
  if (typeof item !== 'string' && !(item instanceof Function)) {
    throw new Error('Cypress plugin waitForSelector: The first parameter should be a string or a function')
  }

  const defaultSettings = {
    timeout: 200,
    tries: 300,
  }
  const SETTINGS = { ...defaultSettings, ...options }

  const check = (item) => {
    if (typeof item === 'string') {
      return Cypress.$(item).length > 0
    } else {
      return item()
    }
  }

  return new Cypress.Promise((resolve, reject) => {
    let index = 0
    const interval = setInterval(() => {
      if (check(item)) {
        clearInterval(interval)
        resolve()
      }
      if (index > SETTINGS.tries) {
        reject()
      }
      index++
    }, SETTINGS.timeout)
  })
}

Cypress.Commands.add('waitForSelector', waitForSelector)

const DEFAULT_OPTS = {
  log: true,
  timeout: 30000,
}

const DEFAULT_IFRAME_SELECTOR = 'iframe'

// This command checks that an iframe has loaded onto the page
// - This will verify that the iframe is loaded to any page other than 'about:blank'
//   cy.frameLoaded()

// - This will verify that the iframe is loaded to any url containing the given path part
//   cy.frameLoaded({ url: 'https://google.com' })
//   cy.frameLoaded({ url: '/join' })
//   cy.frameLoaded({ url: '?some=query' })
//   cy.frameLoaded({ url: '#/hash/path' })

// - You can also give it a selector to check that a specific iframe has loaded
//   cy.frameLoaded('#my-frame')
//   cy.frameLoaded('#my-frame', { url: '/join' })
Cypress.Commands.add('frameLoaded', (selector, opts) => {
  if (selector === undefined) {
    selector = DEFAULT_IFRAME_SELECTOR
  } else if (typeof selector === 'object') {
    opts = selector
    selector = DEFAULT_IFRAME_SELECTOR
  }

  const fullOpts = {
    ...DEFAULT_OPTS,
    ...opts,
  }
  const log = fullOpts.log
    ? Cypress.log({
        name: 'frame loaded',
        displayName: 'frame loaded',
        message: [selector],
      }).snapshot()
    : null
  const hasNavigated = (location) => {
    if (!fullOpts.url) return location !== 'about:blank'
    return typeof fullOpts.url === 'string' ? location.includes(fullOpts.url) : fullOpts.url.test(location)
  }

  // Re-queries the iframe on every retry: the app can remount it, which detaches the first window
  return cy
    .get(selector, { log: false, timeout: fullOpts.timeout })
    .should(($frame) => {
      expect($frame, 'one iframe for cypress-iframe commands').to.have.length(1)
      const contentWindow = $frame.prop('contentWindow')
      expect(contentWindow, 'iframe window').to.exist
      expect(hasNavigated(contentWindow.location.toString()), 'iframe navigated').to.be.true
      expect(contentWindow.document.readyState, 'iframe document').to.equal('complete')
    })
    .then(($frame) => {
      log?.set('$el', $frame).end()
      return $frame
    })
})

// This will cause subsequent commands to be executed inside of the given iframe
// - This will verify that the iframe is loaded to any page other than 'about:blank'
//   cy.iframe().find('.some-button').should('be.visible').click()
//   cy.iframe().contains('Some hidden element').should('not.be.visible')
//   cy.find('#outside-iframe').click() // this will be executed outside the iframe

// - You can also give it a selector to find elements inside of a specific iframe
//   cy.iframe('#my-frame').find('.some-button').should('be.visible').click()
//   cy.iframe('#my-second-frame').contains('Some hidden element').should('not.be.visible')
Cypress.Commands.add('iframe', (selector, opts) => {
  if (selector === undefined) {
    selector = DEFAULT_IFRAME_SELECTOR
  } else if (typeof selector === 'object') {
    opts = selector
    selector = DEFAULT_IFRAME_SELECTOR
  }

  const fullOpts = {
    ...DEFAULT_OPTS,
    ...opts,
  }
  const log = fullOpts.log
    ? Cypress.log({
        name: 'iframe',
        displayName: 'iframe',
        message: [selector],
      }).snapshot()
    : null
  return cy.frameLoaded(selector, { ...fullOpts, log: false }).then(($frame) => {
    log?.set('$el', $frame).end()
    const contentWindow = $frame.prop('contentWindow')
    return Cypress.$(contentWindow.document.body)
  })
})

// This can be used to execute a group of commands within an iframe
// - This will verify that the iframe is loaded to any page other than 'about:blank'
//   cy.enter().then(getBody => {
//     getBody().find('.some-button').should('be.visible').click()
//     getBody().contains('Some hidden element').should('not.be.visible')
//   })
// - You can also give it a selector to find elements inside of a specific iframe
//   cy.enter('#my-iframe').then(getBody => {
//     getBody().find('.some-button').should('be.visible').click()
//     getBody().contains('Some hidden element').should('not.be.visible')
//   })
Cypress.Commands.add('enter', (selector, opts) => {
  if (selector === undefined) {
    selector = DEFAULT_IFRAME_SELECTOR
  } else if (typeof selector === 'object') {
    opts = selector
    selector = DEFAULT_IFRAME_SELECTOR
  }

  const fullOpts = {
    ...DEFAULT_OPTS,
    ...opts,
  }

  const log = fullOpts.log
    ? Cypress.log({
        name: 'enter',
        displayName: 'enter',
        message: [selector],
      }).snapshot()
    : null

  return cy.iframe(selector, { ...fullOpts, log: false }).then(($body) => {
    log?.set('$el', $body).end()
    return () => cy.wrap($body, { log: false })
  })
})

Cypress.Commands.add('setupInterceptors', () => {
  cy.intercept('*', (req) => {
    if (Cypress.expose('SAFE_E2E_ISOLATED')) {
      const host = new URL(req.url).hostname
      if (isRemoteBackendHost(host)) {
        throw new Error(`Isolated Cypress attempted a remote backend request: ${host}`)
      }
    }
    req.headers['Origin'] = 'http://localhost:8080'
    console.log('Intercepted request with headers:', req.headers)
    req.continue()
  }).as('headers')
})

const CHAIN_PREFIX_TO_ID = {
  eth: '1',
  gor: '5',
  gno: '100',
  matic: '137',
  sep: '11155111',
}

function autoTrustSafeFromUrl(url) {
  const match = url.match(/safe=([a-z]+):(0x[a-fA-F0-9]{40})/)
  if (!match) return

  const [, prefix, address] = match
  const chainId = CHAIN_PREFIX_TO_ID[prefix]
  if (!chainId) return

  const key = 'SAFE_v2__addedSafes'
  const existing = localStorage.getItem(key)
  const addedSafes = existing ? JSON.parse(existing) : {}

  if (!addedSafes[chainId]) addedSafes[chainId] = {}
  if (!addedSafes[chainId][address]) {
    addedSafes[chainId][address] = { owners: [], threshold: 1, ethBalance: '0' }
  }

  localStorage.setItem(key, JSON.stringify(addedSafes))
}

Cypress.Commands.overwrite('visit', (originalFn, url, options = {}) => {
  if (options.skipAutoTrust !== true) {
    autoTrustSafeFromUrl(url)
  }
  return originalFn(url, options)
})
