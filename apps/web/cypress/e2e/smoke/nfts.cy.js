import * as constants from '../../support/constants'
import * as nfts from '../pages/nfts.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const nftsName = 'CatFactory'
const nftsAddress = '0x373B...866c'
const nftsTokenID = 'CF'

describe('[SMOKE] NFTs tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    wallet.ensureSiweSession(signer)
    cy.fixture('nfts/nfts.json').then((mockData) => {
      cy.intercept('GET', constants.collectiblesEndpoint, mockData).as('getNfts')
    })
    cy.visit(constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_23)
    cy.wait('@getNfts')
    nfts.waitForNftItems(2)
  })

  // mock
  it('[SMOKE] Verify that NFTs exist in the table', () => {
    nfts.verifyNFTNumber(10)
  })

  // mock
  it('[SMOKE] Verify NFT row contains data', () => {
    nfts.verifyDataInTable(nftsName, nftsAddress, nftsTokenID)
  })

  // mock
  it('[SMOKE] Verify NFT open does not open if no NFT exits', () => {
    nfts.clickOnInactiveNFT()
    nfts.verifyNFTModalDoesNotExist()
  })
})
