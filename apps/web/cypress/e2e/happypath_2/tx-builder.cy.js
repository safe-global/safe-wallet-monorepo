import 'cypress-file-upload'
import * as constants from '../../support/constants.js'
import * as safeapps from '../pages/safeapps.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as navigation from '../pages/navigation.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { getEvents, events, checkDataLayerEvents } from '../../support/utils/gtag.js'
import * as wallet from '../../support/utils/wallet.js'

let safeAppSafes = []
let iframeSelector

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_1_PRIVATE_KEY

describe('Transaction Builder happy path tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    safeAppSafes = await getSafes(CATEGORIES.safeapps)
  })

  it(
    'Verify a simple batch can be created, signed by second signer and deleted. GA tx_confirm, tx_created',
    { defaultCommandTimeout: 50000 },
    () => {
      const tx_created = [
        {
          eventLabel: events.txCreatedTxBuilder.eventLabel,
          eventCategory: events.txCreatedTxBuilder.category,
          eventType: events.txCreatedTxBuilder.eventType,
          event: events.txCreatedTxBuilder.event,
          safeAddress: safeAppSafes.SEP_SAFEAPP_SAFE_1.slice(6),
        },
      ]
      const tx_confirmed = [
        {
          eventLabel: events.txConfirmedTxBuilder.eventLabel,
          eventCategory: events.txConfirmedTxBuilder.category,
          eventType: events.txConfirmedTxBuilder.eventType,
          safeAddress: safeAppSafes.SEP_SAFEAPP_SAFE_1.slice(6),
        },
      ]

      const appUrl = constants.TX_Builder_url
      iframeSelector = `iframe[id="iframe-${encodeURIComponent(appUrl)}"]`
      const visitUrl = `/apps/open?safe=${safeAppSafes.SEP_SAFEAPP_SAFE_1}&appUrl=${encodeURIComponent(appUrl)}`

      cy.visit(constants.transactionQueueUrl + safeAppSafes.SEP_SAFEAPP_SAFE_1)
      wallet.connectSigner(signer)
      cy.wait(5000)
      createtx.deleteAllTx()
      cy.visit(visitUrl)
      navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
      cy.enter(iframeSelector).then((getBody) => {
        getBody().findByLabelText(safeapps.enterAddressStr).type(constants.SAFE_APP_ADDRESS)
        getBody().find(safeapps.contractMethodIndex).parent().click()
        getBody().findByRole('option', { name: safeapps.testAddressValue2 }).click()
        getBody().findByLabelText(safeapps.newAddressValueStr).type(safeAppSafes.SEP_SAFEAPP_SAFE_2)
        getBody().findByText(safeapps.addTransactionStr).click()
        getBody().findAllByText(constants.SEPOLIA_CONTRACT_SHORT).should('have.length', 1)
        getBody().findByText(safeapps.testAddressValueStr).should('exist')
        getBody().findByText(safeapps.createBatchStr).click()
        getBody().findByText(safeapps.sendBatchStr).click()
      })

      createtx.clickOnContinueSignTransactionBtn()
      createtx.clickOnAcknowledgement()
      createtx.clickOnSignTransactionBtn()
      createtx.clickViewTransaction()
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()

      wallet.connectSigner(signer2)
      navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
      createtx.clickOnConfirmTransactionBtn()
      createtx.clickOnNoLaterOption()
      createtx.clickOnContinueSignTransactionBtn()
      createtx.clickOnAcknowledgement()
      createtx.clickOnSignTransactionBtn()
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
      wallet.connectSigner(signer)
      navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
      createtx.deleteTx()
      createtx.verifyNumberOfTransactions(0)
      getEvents()
      checkDataLayerEvents(tx_created)
      checkDataLayerEvents(tx_confirmed)
    },
  )
})
