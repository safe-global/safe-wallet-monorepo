import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as swaps_data from '../../fixtures/swaps_data.json'
import * as navigation from '../pages/navigation.page'
import { dataRow } from '../pages/tables.page'
import { getEvents, events, checkDataLayerEvents } from '../../support/utils/gtag.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer3 = walletCredentials.OWNER_1_PRIVATE_KEY

let staticSafes = []

let iframeSelector

describe('Happy path Swaps tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_1)
    main.waitForHistoryCallToComplete()
    wallet.connectSigner(signer)
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
  })

  it(
    'Verify an order can be created, signed by second signer and deleted. GA tx_confirm, tx_created',
    { defaultCommandTimeout: 60000 },
    () => {
      const tx_created = [
        {
          eventLabel: events.txCreatedSwap.eventLabel,
          eventCategory: events.txCreatedSwap.category,
          eventType: events.txCreatedSwap.eventType,
          safeAddress: staticSafes.SEP_STATIC_SAFE_30.slice(6),
        },
      ]
      const tx_confirmed = [
        {
          eventLabel: events.txConfirmedSwap.eventLabel,
          eventCategory: events.txConfirmedSwap.category,
          eventType: events.txConfirmedSwap.eventType,
          safeAddress: staticSafes.SEP_STATIC_SAFE_30.slice(6),
        },
      ]
      // Clean txs in the queue
      cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_30)
      cy.wait(5000)
      create_tx.deleteAllTx()

      cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_30)
      swaps.acceptLegalDisclaimer()
      cy.wait(4000)
      main.getIframeBody(iframeSelector).within(() => {
        swaps.clickOnSettingsBtn()
        swaps.setSlippage('0.30')
        swaps.setExpiry('2')
        swaps.clickOnSettingsBtn()
        swaps.selectInputCurrency(swaps.swapTokens.cow)
        swaps.setInputValue(200)
        swaps.selectOutputCurrency(swaps.swapTokens.dai)
        swaps.clickOnExceeFeeChkbox()
        swaps.clickOnSwapBtn()
        swaps.clickOnSwapBtn()
        swaps.confirmPriceImpact()
      })
      create_tx.changeNonce(0)
      create_tx.clickOnContinueSignTransactionBtn()
      create_tx.clickOnAcknowledgement()
      create_tx.clickOnSignTransactionBtn()
      create_tx.clickViewTransaction()
      main.verifyValuesExist(dataRow, [create_tx.tx_status.execution_needed])
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
      wallet.connectSigner(signer3)

      cy.wait(5000)
      create_tx.verifyConfirmTransactionBtnIsVisible()
      create_tx.clickOnConfirmTransactionBtn()
      create_tx.clickOnNoLaterOption()

      create_tx.clickOnContinueSignTransactionBtn()
      create_tx.clickOnAcknowledgement()
      create_tx.clickOnSignTransactionBtn()
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
      wallet.connectSigner(signer)
      main.verifyValuesExist(dataRow, [create_tx.tx_status.execution_needed])
      create_tx.deleteTx()

      getEvents()
      checkDataLayerEvents(tx_created)
      checkDataLayerEvents(tx_confirmed)
    },
  )
})
