import 'cypress-file-upload'
import * as constants from '../../support/constants.js'
import * as safeapps from '../pages/safeapps.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as navigation from '../pages/navigation.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'
import { getEvents, events, checkDataLayerEvents } from '../../support/utils/gtag.js'
import * as utils from '../../support/utils/checkers.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import * as wallet from '../../support/utils/wallet.js'

let safeAppSafes = []
let iframeSelector

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_1_PRIVATE_KEY

describe('Transaction Builder 2 tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    safeAppSafes = await getSafes(CATEGORIES.safeapps)
  })

  beforeEach(() => {
    const appUrl = constants.TX_Builder_url
    iframeSelector = `iframe[id="iframe-${appUrl}"]`
    const visitUrl = `/apps/open?safe=${safeAppSafes.SEP_SAFEAPP_SAFE_1}&appUrl=${encodeURIComponent(appUrl)}`
    cy.visit(visitUrl)
  })

  it('Verify a batch cannot be created without method data', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).type(getMockAddress())
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody()
        .findAllByText(safeapps.requiredStr)
        .then(($element) => {
          const color = $element.css('color')
          expect(utils.isInRedRange(color), 'Element color is ').to.be.true
        })
    })
  })

  it('Verify a batch can be uploaded, saved to library, downloaded and removed', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findAllByText('choose a file').attachFile('test-working-batch.json', { subjectType: 'drag-n-drop' })
      getBody().findAllByText('uploaded').wait(300)
      getBody().find(safeapps.saveToLibraryBtn).click()
      getBody().findByLabelText(safeapps.batchNameStr).type(safeapps.e3eTestStr)
      getBody().findAllByText(safeapps.createBtnStr).should('not.be.disabled').click()
      getBody().findByText(safeapps.transactionLibraryStr).click()
      getBody().find(safeapps.downloadBatchBtn).click()
      getBody().find(safeapps.deleteBatchBtn).click()
      getBody().findAllByText(safeapps.confirmDeleteBtnStr).should('not.be.disabled').click()
      getBody().findByText(safeapps.noSavedBatchesStr).should('be.visible')
      getBody().findByText(safeapps.backToTransactionStr).should('be.visible')
    })
    cy.readFile('cypress/downloads/E2E test.json').should('exist')
  })

  it('Verify there is notification if uploaded batch is from a different chain', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findAllByText('choose a file').attachFile('test-mainnet-batch.json', { subjectType: 'drag-n-drop' })
      getBody().findAllByText(safeapps.warningStr).should('be.visible')
      getBody().findAllByText(safeapps.anotherChainStr).should('be.visible')
    })
  })

  it('Verify there is error message when a modified batch is uploaded', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findAllByText('choose a file').attachFile('test-modified-batch.json', { subjectType: 'drag-n-drop' })
      getBody().findAllByText(safeapps.changedPropertiesStr)
      getBody().findAllByText('choose a file').should('be.visible')
    })
  })

  it('Verify an invalid batch cannot be uploaded', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody()
        .findAllByText('choose a file')
        .attachFile('test-invalid-batch.json', { subjectType: 'drag-n-drop' })
        .findAllByText('choose a file')
        .should('be.visible')
    })
  })

  it('Verify an empty batch cannot be uploaded', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody()
        .findAllByText('choose a file')
        .attachFile('test-empty-batch.json', { subjectType: 'drag-n-drop' })
        .findAllByText('choose a file')
        .should('be.visible')
    })
  })

  it('Verify a valid batch as successful can be simulated', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).type(safeAppSafes.SEP_SAFEAPP_SAFE_2)
      getBody().findByText(safeapps.keepProxiABIStr).click()
      getBody().findByLabelText(safeapps.tokenAmount).type('0')
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByText(safeapps.simulateBtnStr).click()
      getBody().findByText(safeapps.transferStr).should('be.visible')
      getBody().findByText(safeapps.successStr).should('be.visible')
    })
  })

  it('Verify an invalid batch as failed can be simulated', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.enterAddressStr).type(safeAppSafes.SEP_SAFEAPP_SAFE_2)
      getBody().findByText(safeapps.keepProxiABIStr).click()
      getBody().findByLabelText(safeapps.tokenAmount).type('100')
      getBody().findByText(safeapps.addTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByText(safeapps.simulateBtnStr).click()
      getBody().findByText(safeapps.failedStr).should('be.visible')
    })
  })

  it('Verify a simple batch can be created, signed by second signer and deleted. GA tx_confirm, tx_created', () => {
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
    wallet.connectSigner(signer)
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
    createtx.clickOnConfirmTransactionBtn()
    createtx.clickOnContinueSignTransactionBtn()
    createtx.clickOnAcknowledgement()
    createtx.clickOnSignTransactionBtn()
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer)
    createtx.deleteTx()
    createtx.verifyNumberOfTransactions(0)
    getEvents()
    checkDataLayerEvents(tx_created)
    checkDataLayerEvents(tx_confirmed)
  })
})
