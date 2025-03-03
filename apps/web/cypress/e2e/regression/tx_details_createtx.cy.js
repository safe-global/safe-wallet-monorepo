import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as txs from '../pages/transactions.page.js'
import * as safeapps from '../pages/safeapps.pages'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const contracts = {
  illegal: '0xF184a243925Bf7fb1D64487339FF4F177Fb75644',
  '1_4_1': '0xfd0732dc9e303f09fcef3a7388ad10a83459ec99',
}
const appUrl = constants.TX_Builder_url
const iframeSelector = `iframe[id="iframe-${appUrl}"]`

describe('Transaction details create tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that there is an error if tx contain unofficial fallbackhandler on tx confirmation screen', () => {
    cy.visit(`/apps/open?safe=${staticSafes.SEP_STATIC_SAFE_36}&appUrl=${encodeURIComponent(appUrl)}`)
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).type(staticSafes.SEP_STATIC_SAFE_36)
      getBody().findByRole('button', { name: safeapps.useImplementationABI }).click()
      getBody().find(safeapps.contractMethodIndex).parent().click()
      getBody().findByRole('option', { name: 'setFallbackHandler' }).click()
      getBody().find(safeapps.handlerInput).type(contracts.illegal)
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByText(safeapps.sendBatchStr).click()
    })
    safeapps.verifyUntrustedHandllerWarningVisible()
  })

  it(
    'Verify that no error for the COWSwap fallbackhandler on confirm tx screen',
    { defaultCommandTimeout: 30000 },
    () => {
      cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_27)
      const iframeSelector = `iframe[src*="${constants.swapWidget}"]`

      wallet.connectSigner(signer)
      swaps.acceptLegalDisclaimer()
      cy.wait(4000)
      main.getIframeBody(iframeSelector).within(() => {
        swaps.switchToTwap()
      })
      swaps.unlockTwapOrders(iframeSelector)
      main.getIframeBody(iframeSelector).within(() => {
        swaps.selectInputCurrency(swaps.swapTokens.cow)
        swaps.setInputValue(600)
        swaps.selectOutputCurrency(swaps.swapTokens.dai)
        swaps.clickOnReviewOrderBtn()
        swaps.placeTwapOrder()
      })
      txs.verifyExecuteBtnIsVisible()
      txs.verifyUntrustedHandllerWarningDoesNotExist()
    },
  )

  it('Verify that when the tx contains the action with an official 1.4.1 fallbackhandler contract there is no error', () => {
    cy.visit(`/apps/open?safe=${staticSafes.SEP_STATIC_SAFE_36}&appUrl=${encodeURIComponent(appUrl)}`)
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).type(staticSafes.SEP_STATIC_SAFE_36)
      getBody().findByRole('button', { name: safeapps.useImplementationABI }).click()
      getBody().find(safeapps.contractMethodIndex).parent().click()
      getBody().findByRole('option', { name: 'setFallbackHandler' }).click()
      getBody().find(safeapps.handlerInput).type(contracts['1_4_1'])
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByText(safeapps.sendBatchStr).click()
    })
    cy.wait(2000)
    safeapps.clickOnAdvancedDetails()
    safeapps.verifyUntrustedHandllerWarningDoesNotExist()
  })
})
