import * as constants from '../../support/constants.js'
import * as safeapps from '../pages/safeapps.pages.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as utils from '../../support/utils/checkers.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import * as ls from '../../support/localstorage_data.js'

let safeAppSafes = []
let iframeSelector

describe('Transaction Builder 2 tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    safeAppSafes = await getSafes(CATEGORIES.safeapps)
  })

  beforeEach(() => {
    const appUrl = constants.TX_Builder_url
    iframeSelector = safeapps.getSafeAppIframeSelector(appUrl)
    const visitUrl = `/apps/open?safe=${safeAppSafes.SEP_SAFEAPP_SAFE_1}&appUrl=${encodeURIComponent(appUrl)}`
    // tx-builder keeps its form disabled until the address book permission prompt is answered:
    // pre-grant it before the visit
    main.addToLocalStorage(constants.SAFE_PERMISSIONS_KEY, ls.safeAppSafePermissions(appUrl))
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
      getBody()
        .findAllByText('choose a file')
        .selectFile('cypress/fixtures/test-working-batch.json', { action: 'drag-drop' })
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

      // Clear the uploaded draft: the app persists it in its own localStorage, and with
      // testIsolation off the next tests would land on the batch view instead of the dropzone
      getBody().findByText(safeapps.backToTransactionStr).click()
      getBody().findByText(safeapps.createBatchStr).click()
      getBody().findByRole('button', { name: safeapps.cancelBtnStr }).click()
      getBody().findByText(safeapps.clearTransactionListStr)
      getBody().findByRole('button', { name: safeapps.confirmClearTransactionListStr }).click()
      getBody().findAllByText('choose a file').should('be.visible')
    })
    cy.readFile('cypress/downloads/E2E test.json').should('exist')
  })

  it('Verify there is notification if uploaded batch is from a different chain', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody()
        .findAllByText('choose a file')
        .selectFile('cypress/fixtures/test-mainnet-batch.json', { action: 'drag-drop' })
      getBody().findAllByText(safeapps.warningStr).should('be.visible')
      getBody().findAllByText(safeapps.anotherChainStr).should('be.visible')
    })
  })

  it('Verify there is error message when a modified batch is uploaded', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody()
        .findAllByText('choose a file')
        .selectFile('cypress/fixtures/test-modified-batch.json', { action: 'drag-drop' })
      getBody().findAllByText(safeapps.changedPropertiesStr)
      getBody().findAllByText('choose a file').should('be.visible')
    })
  })

  it('Verify an invalid batch cannot be uploaded', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody()
        .findAllByText('choose a file')
        .selectFile('cypress/fixtures/test-invalid-batch.json', { action: 'drag-drop' })
        .findAllByText('choose a file')
        .should('be.visible')
    })
  })

  it('Verify an empty batch cannot be uploaded', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody()
        .findAllByText('choose a file')
        .selectFile('cypress/fixtures/test-empty-batch.json', { action: 'drag-drop' })
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
})
