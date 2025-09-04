import 'cypress-file-upload'
import * as constants from '../../support/constants'
import * as safeapps from '../pages/safeapps.pages'
import * as navigation from '../pages/navigation.page'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { getMockAddress } from '../../support/utils/ethers.js'

let safeAppSafes = []
let iframeSelector

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Drain Account tests', { defaultCommandTimeout: 40000 }, () => {
  before(async () => {
    safeAppSafes = await getSafes(CATEGORIES.safeapps)
  })

  beforeEach(() => {
    const appUrl = constants.drainAccount_url
    iframeSelector = `iframe[id="iframe-${encodeURIComponent(appUrl)}"]`
    const visitUrl = `/apps/open?safe=${safeAppSafes.SEP_SAFEAPP_SAFE_1}&appUrl=${encodeURIComponent(appUrl)}`
    cy.intercept(`**//v1/chains/11155111/safes/${safeAppSafes.SEP_SAFEAPP_SAFE_1.substring(4)}/balances/**`, {
      fixture: 'balances.json',
    })
    cy.visit(visitUrl)
    cy.get(iframeSelector, { timeout: 30000 }).should('be.visible')
  })

  it('Verify drain can be created', () => {
    wallet.connectSigner(signer)
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.recipientStr).type(getMockAddress())
      getBody().findAllByText(safeapps.transferEverythingStr).click()
    })
    cy.findByRole('button', { name: safeapps.testTransfer1 })
    cy.findByRole('button', { name: safeapps.nativeTransfer2 })
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify partial drain can be created', () => {
    wallet.connectSigner(signer)
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.selectAllRowsChbxStr).click()
      getBody().findAllByLabelText(safeapps.selectRowChbxStr).eq(1).click()
      getBody().findAllByLabelText(safeapps.selectRowChbxStr).eq(2).click()
      getBody().findByLabelText(safeapps.recipientStr).clear().type(getMockAddress())
      getBody().findAllByText(safeapps.transfer2AssetsStr).click()
    })
    cy.findByRole('button', { name: safeapps.testTransfer2 })
    cy.findByRole('button', { name: safeapps.nativeTransfer1 })
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  // Skip until ENS resolve bug is fixed
  it.skip('Verify a drain can be created when a ENS is specified', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.recipientStr).type(constants.ENS_TEST_SEPOLIA).wait(2000)
      getBody().findAllByText(safeapps.transferEverythingStr).click()
    })
    cy.findByRole('button', { name: safeapps.testTransfer1 })
    cy.findByRole('button', { name: safeapps.nativeTransfer2 })
  })

  it('Verify when cancelling a drain, previous data is preserved', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.recipientStr).type(getMockAddress())
      getBody().findAllByText(safeapps.transferEverythingStr).click()
    })
    navigation.clickOnModalCloseBtn(0)
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findAllByText(safeapps.transferEverythingStr).should('be.visible')
    })
  })

  it('Verify a drain cannot be created with no recipient selected', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findAllByText(safeapps.transferEverythingStr).click()
      getBody().findByText(safeapps.validRecipientAddressStr)
    })
  })

  it('Verify a drain cannot be created with invalid recipient selected', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.recipientStr).type(getMockAddress().substring(1))
      getBody().findAllByText(safeapps.transferEverythingStr).click()
      getBody().findByText(safeapps.validRecipientAddressStr)
    })
  })

  it('Verify a drain cannot be created when no assets are selected', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.selectAllRowsChbxStr).click()
      getBody().findByLabelText(safeapps.recipientStr).type(getMockAddress())
      getBody().findAllByText(safeapps.noTokensSelectedStr).should('be.visible')
    })
  })

  it('Verify a drain cannot be created when no assets and recipient are selected', () => {
    cy.enter(iframeSelector).then((getBody) => {
      getBody().findByLabelText(safeapps.selectAllRowsChbxStr).click()
      getBody().findAllByText(safeapps.noTokensSelectedStr).should('be.visible')
    })
  })
})
