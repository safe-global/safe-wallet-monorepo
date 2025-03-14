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

function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

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
  return cy.get(selector, { log: false }).then({ timeout: fullOpts.timeout }, async ($frame) => {
    log?.set('$el', $frame)
    if ($frame.length !== 1) {
      throw new Error(
        `cypress-iframe commands can only be applied to exactly one iframe at a time.  Instead found ${$frame.length}`,
      )
    }

    const contentWindow = $frame.prop('contentWindow')
    const hasNavigated = fullOpts.url
      ? () =>
          typeof fullOpts.url === 'string'
            ? contentWindow.location.toString().includes(fullOpts.url)
            : fullOpts.url?.test(contentWindow.location.toString())
      : () => contentWindow.location.toString() !== 'about:blank'

    while (!hasNavigated()) {
      await sleep(100)
    }

    if (contentWindow.document.readyState === 'complete') {
      return $frame
    }

    const loadLog = Cypress.log({
      name: 'Frame Load',
      message: [contentWindow.location.toString()],
      event: true,
    }).snapshot()
    await new Promise((resolve) => {
      Cypress.$(contentWindow).on('load', resolve)
    })
    loadLog.end()
    log?.finish()
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
    req.headers['Origin'] = 'http://localhost:8080'
    console.log('Intercepted request with headers:', req.headers)
    req.continue()
  }).as('headers')
})

Cypress.Commands.overwrite('visit', (originalFn, url, options = {}) => {
  const maxRetries = 3
  let attempt = 0

  function attemptVisit(resolve, reject) {
    originalFn(url, options)
      .then((response) => {
        if (response && response.status === 429) {
          if (attempt < maxRetries) {
            attempt++
            const waitTime = 6000
            console.warn(
              `Rate limit (429) detected! Retrying in ${waitTime / 1000} seconds... Attempt ${attempt}/${maxRetries}`,
            )
            cy.wait(waitTime).then(() => attemptVisit(resolve, reject))
          } else {
            reject(new Error(`cy.visit failed after ${maxRetries + 1} attempts due to 429 rate limit.`))
          }
        } else {
          resolve(response)
        }
      })
      .catch(reject)
  }

  return new Cypress.Promise((resolve, reject) => {
    attemptVisit(resolve, reject)
  })
})
