import * as constants from '../../support/constants'
import * as nfts from '../pages/nfts.pages'
import * as createTx from '../pages/create_tx.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import { acceptCookies2 } from '../pages/main.page.js'
import { suspendOutreachModal } from '../pages/modals.page.js'

const multipleNFT = ['multiSend']
const multipleNFTAction = 'safeTransferFrom'
const NFTSentName = 'GTT #22'

let nftsSafes,
  staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[PROD] NFTs tests', () => {
  before(() => {
    getSafes(CATEGORIES.nfts)
      .then((nfts) => {
        nftsSafes = nfts
        return getSafes(CATEGORIES.static)
      })
      .then((statics) => {
        staticSafes = statics
      })
  })

  beforeEach(() => {
    cy.visit(constants.prodbaseUrl + constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    wallet.connectSigner(signer)
    acceptCookies2()
    nfts.waitForNftItems(2)
    suspendOutreachModal()
  })

  it('Verify multipls NFTs can be selected and reviewed', () => {
    nfts.verifyInitialNFTData()
    nfts.selectNFTs(3)
    nfts.deselectNFTs([2], 3)
    nfts.sendNFT()
    nfts.verifyNFTModalData()
    nfts.typeRecipientAddress(getMockAddress())
    nfts.clikOnNextBtn()
    nfts.verifyReviewModalData(2)
  })

  it('Verify that when 2 NFTs are selected, actions and tx details are correct in Review step', () => {
    nfts.verifyInitialNFTData()
    nfts.selectNFTs(2)
    nfts.sendNFT()
    nfts.typeRecipientAddress(getMockAddress())
    nfts.clikOnNextBtn()
    nfts.verifyTxDetails(multipleNFT)
    nfts.verifyCountOfActions(2)
    nfts.verifyActionName(0, multipleNFTAction)
    nfts.verifyActionName(1, multipleNFTAction)
  })

  it('Verify Send button is disabled for non-owner', () => {
    cy.visit(constants.prodbaseUrl + constants.balanceNftsUrl + nftsSafes.SEP_NFT_SAFE_2)
    nfts.verifyInitialNFTData()
    acceptCookies2()
    suspendOutreachModal()
    nfts.selectNFTs(1)
    nfts.verifySendNFTBtnDisabled()
  })

  it('Verify Send NFT transaction has been created', () => {
    cy.visit(constants.prodbaseUrl + constants.balanceNftsUrl + nftsSafes.SEP_NFT_SAFE_1)
    wallet.connectSigner(signer)
    nfts.verifyInitialNFTData()
    acceptCookies2()
    suspendOutreachModal()
    nfts.selectNFTs(1)
    nfts.sendNFT()
    nfts.typeRecipientAddress(staticSafes.SEP_STATIC_SAFE_1)
    createTx.changeNonce(2)
    nfts.clikOnNextBtn()
    createTx.clickOnSignTransactionBtn()
    createTx.waitForProposeRequest()
    createTx.clickViewTransaction()
    createTx.verifySingleTxPage()
    createTx.verifyQueueLabel()
    createTx.verifyTransactionStrExists(NFTSentName)
  })
})
