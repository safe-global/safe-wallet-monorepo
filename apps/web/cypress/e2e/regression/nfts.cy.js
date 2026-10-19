import * as constants from '../../support/constants'
import * as nfts from '../pages/nfts.pages'
import * as navigation from '../pages/navigation.page'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import { walletCredentials } from '../../support/credentials.js'

const singleNFT = ['safeTransferFrom']
const multipleNFT = ['multiSend']
const multipleNFTAction = 'safeTransferFrom'

let nftsSafes,
  staticSafes = []

let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})

describe('NFTs tests', () => {
  before(() => {
    return getSafes(CATEGORIES.nfts)
      .then((nfts) => {
        nftsSafes = nfts
        return getSafes(CATEGORIES.static)
      })
      .then((statics) => {
        staticSafes = statics
      })
  })

  beforeEach(() => {
    wallet.connectSignerViaStorage(signer, constants.balanceNftsUrl + staticSafes.SEP_STATIC_SAFE_2)
    nfts.waitForNftItems(2)
  })

  // Added to prod
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

  it('Verify that when 1 NFTs is selected, there is no Actions block in Review step', () => {
    nfts.verifyInitialNFTData()
    nfts.selectNFTs(1)
    nfts.sendNFT()
    nfts.typeRecipientAddress(getMockAddress())
    nfts.clikOnNextBtn()
    nfts.verifyTxDetails(singleNFT)
    nfts.verifyCountOfActions(0)
  })

  // Added to prod
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

  // Added to prod
  it('Verify Send button is disabled for non-owner', () => {
    cy.visit(constants.balanceNftsUrl + nftsSafes.SEP_NFT_SAFE_2)
    nfts.verifyInitialNFTData()
    nfts.selectNFTs(1)
    nfts.verifySendNFTBtnDisabled()
  })

  it('Verify Send button is disabled for disconnected wallet', () => {
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    nfts.selectNFTs(1)
    nfts.verifySendNFTBtnDisabled()
  })
})
