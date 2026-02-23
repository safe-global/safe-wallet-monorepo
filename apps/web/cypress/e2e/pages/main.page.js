import * as constants from '../../support/constants'
import * as ls from '../../support/localstorage_data.js'

// Common button text strings
export const nextBtnStr = 'Next'
export const executeBtnStr = 'Execute'
export const acceptSelectionStr = 'Save settings'

// Common table selectors
export const tableRow = '[data-testid="table-row"]'
export const tableContainer = '[data-testid="table-container"]'
export const nextPageBtn = 'button[aria-label="Go to next page"]'
export const previousPageBtn = 'button[aria-label="Go to previous page"]'

// Common form input selectors
export const nameInput = 'input[name="name"]'
export const addressInput = 'input[name="address"]'

// Common modal selectors
export const modalTitle = '[data-testid="modal-title"]'
export const modalHeader = '[data-testid="modal-header"]'

// Legacy names for backward compatibility
const acceptSelection = 'Save settings'
const executeStr = 'Execute'
const connectedOwnerBlock = '[data-testid="open-account-center"]'
export const modalDialogCloseBtn = '[data-testid="modal-dialog-close-btn"]'
const closeOutreachPopupBtn = 'button[aria-label="close outreach popup"]'

export const noRelayAttemptsError = 'Not enough relay attempts remaining'

/** Waits until all MUI Skeleton placeholders have disappeared, ensuring the page is fully rendered. Used in visual tests before Chromatic captures the screenshot. */
export function verifySkeletonsGone(timeout = 30000) {
  cy.get('.MuiSkeleton-root', { timeout }).should('not.exist')
}

/**
 * Waits for MUI animations (button ripple, modal slide-in, accordion expand) to fully settle.
 * Must be called in visual regression tests after any click or toggle that triggers a MUI transition,
 * otherwise the screenshot captures the mid-animation state and causes flaky Chromatic diffs.
 */
export function waitForMuiAnimationsToSettle() {
  cy.wait(1000)
}

/** Intercepts the chain config API and injects a feature flag if not already present. */
export function enableChainFeature(featureName) {
  cy.intercept('GET', constants.chainConfigEndpoint, (req) => {
    req.continue((res) => {
      if (res.body && res.body.features) {
        if (!res.body.features.includes(featureName)) {
          res.body.features.push(featureName)
        }
      }
    })
  })
}

export function checkElementBackgroundColor(element, color) {
  cy.get(element).should('have.css', 'background-color', color)
}

export function clickOnExecuteBtn() {
  cy.get('button').contains(executeStr).click()
}
export function clickOnSideMenuItem(item) {
  cy.get('p').contains(item).click()
}

export function waitForHistoryCallToComplete() {
  cy.intercept('GET', constants.transactionHistoryEndpoint).as('History')
  cy.wait('@History', { timeout: 20000 })
}

export const fetchSafeData = (safeAddress) => {
  return cy
    .request({
      method: 'GET',
      url: `${constants.stagingTxServiceUrl}/v1${constants.stagingTxServiceSafesUrl}${safeAddress}`,
      headers: {
        accept: 'application/json',
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200)
    })
}
export const getSafe = (safeAddress, chain) => {
  return cy
    .request({
      method: 'GET',
      url: `${constants.stagingCGWUrlv1}${constants.stagingCGWChains}${chain}${constants.stagingCGWSafes}${safeAddress}`,
      headers: {
        accept: 'application/json',
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200)
      console.log('********* RESPONSE ' + JSON.stringify(response.body))
      return response.body
    })
}

export const getSafeBalance = (safeAddress, chain) => {
  return cy
    .request({
      method: 'GET',
      url: `${constants.stagingCGWUrlv1}${constants.stagingCGWChains}${chain}${constants.stagingCGWSafes}${safeAddress}${constants.stagingCGWAllTokensBalances}`,
      headers: {
        accept: 'application/json',
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200)
    })
}

export const getSafeNFTs = (safeAddress, chain) => {
  return cy
    .request({
      method: 'GET',
      url: `${constants.stagingCGWUrlv2}${constants.stagingCGWChains}${chain}${constants.stagingCGWSafes}${safeAddress}${constants.stagingCGWCollectibles}`,
      headers: {
        accept: 'application/json',
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200)
      return response
    })
}

export const getSafeNonce = (safeAddress, chain) => {
  return cy
    .request({
      method: 'GET',
      url: `${constants.stagingCGWUrlv1}${constants.stagingCGWChains}${chain}${constants.stagingCGWSafes}${safeAddress}${constants.stagingCGWNone}`,
      headers: {
        accept: 'application/json',
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200)
    })
}

export function fetchCurrentNonce(safeAddress) {
  return getSafeNonce(safeAddress.substring(4), constants.networkKeys.sepolia).then(
    (response) => response.body.currentNonce,
  )
}

export const getRelayRemainingAttempts = (safeAddress) => {
  const chain = constants.networkKeys.sepolia

  return cy
    .request({
      method: 'GET',
      url: `${constants.stagingCGWUrlv1}${constants.stagingCGWChains}${chain}${constants.relayPath}${safeAddress}`,
      headers: {
        accept: 'application/json',
      },
    })
    .then((response) => {
      console.log('Remaining relay attempts: ', response.body.remaining)
      return response.body.remaining
    })
}

export function verifyNonceChange(safeAddress, expectedNonce, retries = 30, delay = 10000) {
  let attempts = 0

  function checkNonce() {
    return fetchCurrentNonce(safeAddress).then((newNonce) => {
      console.log(`Attempt ${attempts + 1}: newNonce = ${newNonce}, expectedNonce = ${expectedNonce}`)

      if (newNonce === expectedNonce) {
        console.log('Nonce matches the expected value')
        expect(newNonce).to.equal(expectedNonce)
        return
      }

      attempts += 1
      if (attempts < retries) {
        return new Promise((resolve) => {
          setTimeout(resolve, delay)
        }).then(checkNonce)
      } else {
        console.error(`Nonce did not change to expected value after ${retries} attempts`)
        return Promise.reject(new Error(`Nonce did not change to expected value after ${retries} attempts`))
      }
    })
  }

  return checkNonce()
}

export function checkTokenBalance(safeAddress, tokenSymbol, expectedBalance) {
  getSafeBalance(safeAddress.substring(4), constants.networkKeys.sepolia).then((response) => {
    const targetToken = response.body.items.find((token) => token.tokenInfo.symbol === tokenSymbol)
    console.log(targetToken)
    expect(targetToken.balance).to.include(expectedBalance)
  })
}

export function checkTokenBalanceIsNull(safeAddress, tokenSymbol) {
  let pollCount = 0

  function poll() {
    getSafeNFTs(safeAddress.substring(4), constants.networkKeys.sepolia).then((response) => {
      const targetToken = response.body.results.find((token) => token.tokenSymbol === tokenSymbol)
      if (targetToken === undefined) {
        console.log('Token is undefined as expected. Stopping polling.')
        return true
      } else if (pollCount < 10) {
        pollCount++
        console.log('Token is not undefined, retrying...')
        cy.wait(5000)
        poll()
      } else {
        throw new Error('Failed to validate token status within the allowed polling attempts.')
      }
    })
  }
  cy.wrap(null).then(poll).should('be.true')
}

export function acceptCookies(index = 0) {
  cy.wait(1000)

  cy.findAllByText('Got it!')
    .should('have.length.at.least', index)
    .each(($el) => $el.click())

  cy.get('button')
    .contains(acceptSelection)
    .should(() => {})
    .then(($button) => {
      if (!$button.length) {
        return
      }
      cy.wrap($button).click()
      cy.contains(acceptSelection).should('not.exist')
      cy.wait(500)
    })
}

export function acceptCookies2() {
  cy.wait(2000)
  cy.get('body').then(($body) => {
    if ($body.find('button:contains(' + acceptSelection + ')').length > 0) {
      cy.contains('button', acceptSelection).click()
      cy.wait(500)
    }
  })
}

export function closeOutreachPopup() {
  cy.wait(1000)
  cy.get('body').then(($body) => {
    if ($body.find(closeOutreachPopupBtn).length > 0) {
      cy.get(closeOutreachPopupBtn).click()
      cy.wait(500)
    }
  })
}

export function closeSecurityNotice() {
  const value = 'I understand'
  cy.wait(2000)
  cy.get('body').then(($body) => {
    if ($body.find('button:contains(' + value + ')').length > 0) {
      cy.contains('button', value).click()
      cy.wait(500)
    }
  })
}

export function verifyOwnerConnected(prefix = 'sep:') {
  cy.get(connectedOwnerBlock).should('contain', prefix)
}

export function verifyHomeSafeUrl(safe) {
  cy.location('href', { timeout: 10000 }).should('include', constants.homeUrl + safe)
}

export function verifyLinkContainsUrl(linkSelector, urlPattern) {
  if (typeof linkSelector === 'string') {
    cy.contains(linkSelector).closest('a').should('have.attr', 'href').and('include', urlPattern)
  } else {
    linkSelector.should('have.attr', 'href').and('include', urlPattern)
  }
}

export function checkTextsExistWithinElement(element, texts) {
  texts.forEach((text) => {
    cy.get(element)
      .should('be.visible')
      .within(() => {
        cy.get('div').contains(text).should('be.visible')
      })
  })
}
export function checkTextsExistWithinElementScroll(element, texts) {
  texts.forEach((text) => {
    cy.get(element)
      .scrollIntoView()
      .should('be.visible')
      .within(() => {
        cy.get('div').contains(text).scrollIntoView().should('be.visible')
      })
  })
}

export function verifyCheckboxeState(element, index, state) {
  cy.get(element).eq(index).should(state)
}

export function verifyInputValue(selector, value) {
  cy.get(selector).invoke('val').should('include', value)
}

export function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZz0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

export function verifyElementsCount(element, count) {
  cy.get(element).should('have.length', count)
}

export function verifyMinimumElementsCount(element, count) {
  cy.get(element).should('have.length.at.least', count)
}

export function verifyValuesDoNotExist(element, values) {
  values.forEach((value) => {
    cy.get(element).should('not.contain', value)
  })
}

export function verifyValuesExist(element, values) {
  values.forEach((value) => {
    cy.get(element).should('contain', value)
  })
}

export function verifyElementsExist(elements) {
  elements.forEach((element) => {
    cy.get(element).should('exist')
  })
}

export function verifyElementsIsVisible(elements) {
  elements.forEach((element) => {
    cy.get(element).scrollIntoView().should('be.visible')
  })
}

export function getTextToArray(selector, textArray) {
  cy.get(selector).each(($element) => {
    textArray.push($element.text())
  })
}

export function extractDigitsToArray(selector, digitsArray) {
  cy.get(selector).each(($element) => {
    const text = $element.text()
    const digits = text.match(/\d+\.\d+|\d+\b/g)
    if (digits) {
      digitsArray.push(...digits)
    }
  })
}

export function isItemInLocalstorage(key, expectedValue, maxAttempts = 10, delay = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0

    const isItemInLocalstorage = () => {
      attempts++
      const storedValue = JSON.parse(window.localStorage.getItem(key))
      const keyEqualsValue = JSON.stringify(expectedValue) === JSON.stringify(storedValue)
      if (keyEqualsValue) {
        resolve()
      } else if (attempts < maxAttempts) {
        setTimeout(isItemInLocalstorage, delay)
      } else {
        reject(error)
      }
    }
    isItemInLocalstorage()
  })
}

export function addToLocalStorage(key, jsonValue) {
  return new Promise((resolve, reject) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(jsonValue))
      resolve('Item added to local storage successfully')
    } catch (error) {
      reject('Error adding item to local storage: ' + error)
    }
  })
}

/**
 * Sets localStorage in the app window (AUT). Use after cy.visit() then cy.reload() so the app picks up the data.
 * Use this when the test runs in Cypress and the app must see the data (addToLocalStorage writes to the runner's window).
 */
export function addToAppLocalStorage(key, jsonValue) {
  return cy.window().then((win) => {
    win.localStorage.setItem(key, JSON.stringify(jsonValue))
  })
}

/**
 * Sets up SAFE_v2__settings in localStorage with tokenList: "ALL" and hideDust: false
 * This function sets up the settings and verifies they are stored correctly before proceeding
 * @returns {Promise} A promise that resolves when settings are set and verified
 */
export function setupSafeSettingsWithAllTokens() {
  const settings = {
    ...ls.safeSettings.slimitSettings,
  }
  return cy
    .wrap(null)
    .then(() => addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, settings))
    .then(() => isItemInLocalstorage(constants.localStorageKeys.SAFE_v2__settings, settings))
}

export function checkTextOrder(selector, expectedTextArray) {
  cy.get(selector).each((element, index) => {
    const text = Cypress.$(element).text().trim()
    expect(text).to.include(expectedTextArray[index])
  })
}

export function verifyElementsStatus(elements, status) {
  elements.forEach((element) => {
    cy.get(element).should(status)
  })
}

export function formatAddressInCaps(address) {
  if (address.startsWith('sep:0x')) {
    return '0x' + address.substring(6).toUpperCase()
  } else {
    return 'Invalid address format'
  }
}

export function verifyTextVisibility(stringsArray) {
  stringsArray.forEach((string) => {
    cy.contains(string).should('be.visible')
  })
}

export function verifyTextNotVisible(stringsArray) {
  stringsArray.forEach((string) => {
    cy.contains(string).should('not.exist')
  })
}

export function getIframeBody(iframe) {
  return cy.get(iframe).its('0.contentDocument.body').should('not.be.empty').then(cy.wrap)
}

export const checkButtonByTextExists = (buttonText) => {
  cy.get('button').contains(buttonText).should('exist')
}

export function getAddedSafeAddressFromLocalStorage(chainId, index) {
  return cy.window().then((win) => {
    const addedSafes = win.localStorage.getItem(constants.localStorageKeys.SAFE_v2__addedSafes)
    const addedSafesObj = JSON.parse(addedSafes)
    const safeAddress = Object.keys(addedSafesObj[chainId])[index]
    return safeAddress
  })
}

export function changeSafeChainName(originalChain, newChain) {
  return originalChain.replace(/^[^:]+:/, newChain + ':')
}

export function getSafeAddressFromUrl(url) {
  const addressPattern = /0x[a-fA-F0-9]{40}/
  const match = url.match(addressPattern)
  return match ? match[0] : null
}

export function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Waits for an element with given text to be visible inside a specific container (by ID)
export function waitForElementByTextInContainer(containerSelector, elementText) {
  cy.get(containerSelector) // Wait for container to exist
    .should('exist')
    .should('be.visible')
    .contains(elementText, { timeout: 10000 }) // Then find text inside
    .should('exist')
    .should('be.visible')
}

export function verifyElementByTextExists(text) {
  cy.contains(text).should('exist')
}

// ===========================================
// Generic Helper Functions
// ===========================================

// Button clicks
export function clickOnNextBtn(selector) {
  cy.get(selector).should('be.enabled').click()
}

export function clickOnBackBtn(selector) {
  cy.get(selector).should('be.enabled').click()
}

// Button state verification
export function verifyBtnIsEnabled(selector) {
  cy.get(selector).should('not.be.disabled')
}

export function verifyBtnIsDisabled(selector) {
  cy.get(selector).should('be.disabled')
}

// Input helpers
export function typeInField(selector, value) {
  cy.get(selector).clear().type(value)
}

export function clearField(selector) {
  cy.get(selector).clear()
}
