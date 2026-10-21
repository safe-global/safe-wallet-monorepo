import * as constants from '../../support/constants.js'
import * as safeapps from '../pages/safeapps.pages.js'
import * as navigation from '../pages/navigation.page.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'

let safeAppSafes = []
let iframeSelector

describe('Transaction Builder tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    safeAppSafes = await getSafes(CATEGORIES.safeapps)
  })

  beforeEach(() => {
    const appUrl = constants.TX_Builder_url
    iframeSelector = safeapps.getSafeAppIframeSelector(appUrl)
    const visitUrl = `/apps/open?safe=${safeAppSafes.SEP_SAFEAPP_SAFE_1}&appUrl=${encodeURIComponent(appUrl)}`
    // Pre-grant the permission so the host's consent prompt never blocks the iframe.
    main.addToLocalStorage(constants.SAFE_PERMISSIONS_KEY, ls.safeAppSafePermissions(appUrl))
    cy.visit(visitUrl)
    safeapps.verifySafeAppIframeVisible(appUrl)
  })

  it('Verify it is allowed to go back without removing data and add more transactions to the batch', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).type(constants.SAFE_APP_ADDRESS)
      getBody().find(safeapps.contractMethodIndex).parent().click()
      getBody().findByRole('option', { name: safeapps.testAddressValue2 }).click()
      getBody().findByLabelText(safeapps.newAddressValueStr).type(safeAppSafes.SEP_SAFEAPP_SAFE_2)
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByText(safeapps.backToTransactionStr).click()
      getBody().findByLabelText(safeapps.enterAddressStr).type(constants.SAFE_APP_ADDRESS)
      getBody().find(safeapps.contractMethodIndex).parent().click()
      getBody().findByRole('option', { name: safeapps.testAddressValue2 }).click()
      getBody().findByLabelText(safeapps.newAddressValueStr).type(safeAppSafes.SEP_SAFEAPP_SAFE_2)
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByText(safeapps.sendBatchStr).click()
    })
    cy.get('h4').contains(safeapps.transactionBuilderStr).should('be.visible')
    safeapps.checkActions(2, safeapps.basicTypesTestContractStr)
    navigation.clickOnModalCloseBtn(0)
    navigation.clickOnDiscardTxBtn()
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findAllByText(constants.SEPOLIA_CONTRACT_SHORT).should('have.length', 2)
      getBody().findAllByText(safeapps.testAddressValue2).should('have.length', 2)
    })
  })

  it('Verify a new user gets the address book permissions prompt and accepting it continues to the tx modal', () => {
    // Fresh user: drop the permission the beforeEach pre-grants, then reload so the app forgets it
    cy.window().then((win) => win.localStorage.removeItem(constants.SAFE_PERMISSIONS_KEY))
    cy.reload()
    safeapps.verifySafeAppIframeVisible(constants.TX_Builder_url)

    // Must be .click(), not .type(): clicking the empty field is what triggers the permission
    // request, and cy.type() additionally asserts the element still has focus, which the prompt takes.
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).click()
    })

    safeapps.verifyPermissionsRequestVisible()
    safeapps.verifyAccessToAddressBookExists()
    safeapps.clickOnPermissionsAcceptBtn()

    // Re-enter: the handle above resolved against the document while the modal was blocking it.
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).type(constants.SAFE_APP_ADDRESS)
      getBody().find(safeapps.contractMethodIndex).parent().click()
      getBody().findByRole('option', { name: safeapps.testAddressValue2 }).click()
      getBody().findByLabelText(safeapps.newAddressValueStr).type(safeAppSafes.SEP_SAFEAPP_SAFE_2)
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByText(safeapps.sendBatchStr).click()
    })

    cy.get('h4').contains(safeapps.transactionBuilderStr).should('be.visible')
  })
})
