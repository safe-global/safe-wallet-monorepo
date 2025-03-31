import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as nfts from '../pages/nfts.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const nftsName = 'CatFactory'
const nftsAddress = '0x373B...866c'
const nftsTokenID = 'CF'

describe('NFTs 2 tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(2)
  })

  it('Verify that NFTs exist in the table', () => {
    nfts.verifyNFTNumber(10)
  })

  it('Verify NFT row contains data', () => {
    nfts.verifyDataInTable(nftsName, nftsAddress, nftsTokenID)
  })

  // skipped because the NFT metadata fetching is turned off on tx_service
  it.skip('Verify NFT preview window can be opened', () => {
    nfts.openActiveNFT(0)
    nfts.verifyNameInNFTModal(nftsTokenID)
    nfts.verifySelectedNetwrokSepolia()
    nfts.closeNFTModal()
  })

  it('Verify NFT open does not open if no NFT exits', () => {
    nfts.clickOnInactiveNFT()
    nfts.verifyNFTModalDoesNotExist()
  })
})
