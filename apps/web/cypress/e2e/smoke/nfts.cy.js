import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as nfts from '../pages/nfts.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const nftsName = 'CatFactory'
const nftsAddress = '0x373B...866c'
const nftsTokenID = 'CF'

describe.skip('[SMOKE] NFTs tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(2)
  })

  it('[SMOKE] Verify that NFTs exist in the table', () => {
    nfts.verifyNFTNumber(10)
  })

  it('[SMOKE] Verify NFT row contains data', () => {
    nfts.verifyDataInTable(nftsName, nftsAddress, nftsTokenID)
  })

  // skipped because the NFT metadata fetching is turned off on tx_service
  it.skip('[SMOKE] Verify NFT preview window can be opened', () => {
    nfts.openActiveNFT(0)
    nfts.verifyNameInNFTModal(nftsTokenID)
    nfts.verifySelectedNetwrokSepolia()
    nfts.closeNFTModal()
  })

  it('[SMOKE] Verify NFT open does not open if no NFT exits', () => {
    nfts.clickOnInactiveNFT()
    nfts.verifyNFTModalDoesNotExist()
  })
})
