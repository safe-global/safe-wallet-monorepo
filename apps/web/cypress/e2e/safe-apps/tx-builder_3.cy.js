import 'cypress-file-upload'
import * as constants from '../../support/constants.js'
import * as safeapps from '../pages/safeapps.pages.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []
let iframeSelector

describe('Transaction Builder 3 tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    const appUrl = constants.TX_Builder_url
    iframeSelector = `iframe[id="iframe-${encodeURIComponent(appUrl)}"]`
    const visitUrl = `/apps/open?safe=${staticSafes.SEP_STATIC_SAFE_43}&appUrl=${encodeURIComponent(appUrl)}`
    cy.visit(visitUrl)
  })

  it('Verify that no error for the COWSwap fallbackhandler on confirm tx screen', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).type(staticSafes.SEP_STATIC_SAFE_43)
      getBody().findByRole('button', { name: safeapps.useImplementationABI }).click()
      getBody().find(safeapps.contractMethodSelector).click()
      getBody().find(safeapps.contractMethodIndex).parent().click()
      getBody().findByRole('option', { name: safeapps.cowFallback }).click()
      getBody().find(safeapps.handlerInput).type(safeapps.cowFallbackHandler)
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByText(safeapps.sendBatchStr).click()
    })
    safeapps.clickOnAdvancedDetails()
    main.verifyElementsIsVisible([safeapps.cowFallBackHandlerTitle])
    safeapps.verifyUntrustedHandllerWarningDoesNotExist()
  })
})
