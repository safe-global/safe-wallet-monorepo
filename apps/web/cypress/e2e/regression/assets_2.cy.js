import * as constants from '../../support/constants.js'
import * as assets from '../pages/assets.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as main from '../pages/main.page.js'
import * as nfts from '../pages/nfts.pages.js'

let staticSafes = []

const nftCollectionName = 'CatFactory'
const nftTokenSymbol = 'CF'

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

    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    main.verifyValuesExist(assets.tokenListTable, spamTokens)
    main.verifyElementsCount(assets.tablePaginationContainer, 0)
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

  it('Verify NFT rows show the collection, token ID and shortened address', () => {
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(5)
    assets.checkNftAddressFormat()
    nfts.verifyDataInTable(nftCollectionName, assets.shortAddressRegex, nftTokenSymbol)
  })

  it('Verify every NFT has the copy-to-clipboard and blockexplorer button', () => {
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(5)
    assets.checkNftCopyIconAndLink()
  })
})
