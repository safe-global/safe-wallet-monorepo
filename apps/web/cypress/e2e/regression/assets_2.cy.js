import * as constants from '../../support/constants.js'
import * as assets from '../pages/assets.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as main from '../pages/main.page.js'
import * as navigation from '../pages/navigation.page'
import * as nfts from '../pages/nfts.pages.js'
import { clickOnAssetSwapBtn } from '../pages/swaps.pages.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_1_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Assets 2 tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify no pagination shows at the bottom if there are less than 25 rows', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    let spamTokens = [
      assets.currencyAave,
      assets.currencyTestTokenA,
      assets.currencyTestTokenB,
      assets.currencyUSDC,
      assets.currencyLink,
      assets.currencyDaiCap,
    ]

    assets.selectTokenList(assets.tokenListOptions.allTokens)
    main.verifyValuesExist(assets.tokenListTable, spamTokens)
    main.verifyElementsCount(assets.tablePaginationContainer, 0)
  })

  it('Verify Proposers have the Send and Swap buttons enabled', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_31)
    wallet.connectSigner(signer)
    assets.selectTokenList(assets.tokenListOptions.default)
    main.verifyValuesExist(assets.tokenListTable, [constants.tokenNames.sepoliaEther])
    assets.showSendBtn().should('be.enabled')
    assets.showSwapBtn().should('be.enabled')
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that Send and Swap buttons are enabled for spending limit users', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_8)
    wallet.connectSigner(signer2)
    assets.selectTokenList(assets.tokenListOptions.default)
    main.verifyValuesExist(assets.tokenListTable, [constants.tokenNames.sepoliaEther])
    assets.showSendBtn().should('be.enabled')
    assets.showSwapBtn().should('be.enabled')
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify the counter at the top is updated for every selected token', () => {
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(5)
    nfts.selectNFTs(1)
  })

  it('Verify the "select all" checkbox does checks all the nfts', () => {
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(5)
    nfts.selectAllNFTs()
    nfts.checkSelectedNFTsNumberIs(10)
  })

  it('Verify every NFT has its shorten address', () => {
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(5)
    assets.checkNftAddressFormat()
  })

  it('Verify every NFT has the copy-to-clipboard and blockexplorer button', () => {
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(5)
    assets.checkNftCopyIconAndLink()
  })
})
