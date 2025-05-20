import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as nsafes from '../pages/nestedsafes.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as owner from '../pages/owners.pages.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Nested safes fund asset tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_45)
    wallet.connectSigner(signer)
    sideBar.clickOnOpenNestedSafeListBtn()
    nsafes.clickOnAddNestedSafeBtn()
  })

  it('Verify that the token can be selected from the drop-down', () => {
    nsafes.clickOnFundAssetBtn()
    nsafes.setMaxAmountValue(0)
    nsafes.clickOnFundAssetBtn()
    nsafes.selectToken(1, constants.tokenNames.cow)
    nsafes.setMaxAmountValue(1)
    nsafes.verifyMaxAmount(1, constants.tokenNames.cow, constants.tokenAbbreviation.cow)
  })

  it('Verify that the same token can not be selected a few times', () => {
    nsafes.clickOnFundAssetBtn()
    nsafes.selectToken(0, constants.tokenNames.sepoliaEther)
    nsafes.clickOnFundAssetBtn()
    nsafes.getTokenList(1).then((tokens) => {
      expect(tokens).to.not.include(constants.tokenNames.sepoliaEther)
    })
  })

  it('Verify that the erorr appears if entered amount> available amount of the token', () => {
    nsafes.clickOnFundAssetBtn()
    nsafes.setSendValue(0, 0.1)
    owner.verifyErrorMsgInvalidAddress(constants.amountErrorMsg.largerThanCurrentBalance)
  })

  it('Verify that click on Max adds all available token amount', () => {
    nsafes.clickOnFundAssetBtn()
    nsafes.setMaxAmountValue(0)
    nsafes.verifyMaxAmount(0, constants.tokenNames.sepoliaEther, constants.tokenAbbreviation.sep)
  })

  it('Verify that delete icon removes one line of Fund new asset', () => {
    nsafes.clickOnFundAssetBtn()
    nsafes.setMaxAmountValue(0)
    nsafes.clickOnFundAssetBtn()
    nsafes.getAssetCount().then((count) => {
      expect(count).to.equal(2)
    })

    nsafes.removeAsset(1)
    nsafes.getAssetCount().then((count) => {
      expect(count).to.equal(1)
    })
  })
})
