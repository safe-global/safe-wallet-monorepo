import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import * as ls from '../../support/localstorage_data.js'
import * as proposer from '../pages/proposers.pages.js'
import { getMockAddress } from '../../support/utils/ethers.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_1_PRIVATE_KEY
const proposerAddress = 'sep:0xC16D...6fED'
const proposerAddress2 = '0x8eeC...2a3b'
const creatorAddress = 'sep:0xC16D...6fED'
const proposerName = 'Proposer 1'
const proposerNameAD = 'AD Proposer1'
const proposedTx =
  '&id=multisig_0x09725D3c2f9bE905F8f9f1b11a771122cf9C9f35_0xd70f2f8b31ae98a7e3064f6cdb437e71d3df083a0709fb82c915fa82767a19eb'

describe('Proposers tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    wallet.connectSignerViaStorage(signer)
  })

  it('Verify the proposers section on the Set up in the settings when there are no proposers', () => {
    main.verifyElementsCount(proposer.proposersSection, 1)
  })

  it('Verify the "Add proposers" button is disabled for non-owner/disconnected users', () => {
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    proposer.verifyAddProposerBtnIsDisabled()
    wallet.connectSigner(signer2)
    proposer.verifyAddProposerBtnIsDisabled()
  })

  it('Verify that a proposer cannot be the safe itself', () => {
    proposer.clickOnAddProposerBtn()
    proposer.enterProposerData(staticSafes.SEP_STATIC_SAFE_31.substring(4), main.generateRandomString(5))
    proposer.checkSafeAsProposerErrorMessage()
  })

  it('Verify that a proposer address must be checksummed', () => {
    proposer.clickOnAddProposerBtn()
    proposer.enterProposerData(getMockAddress().replace('A', 'a'), main.generateRandomString(5))
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)
  })

  it('Verify a proposer Creator is shown in the table', () => {
    proposer.checkCreatorAddress([creatorAddress])
  })

  it('Verify non-creators of a proposers cannot edit or delete it', () => {
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer2)
    proposer.verifyDeleteProposerBtnIsDisabled(proposerAddress)
    proposer.verifyEditProposerBtnDisabled(proposerAddress)
  })

  it('Verify that the address book name of the proposers overwrites the name given during its creation', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.proposers)
    cy.reload()
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    proposer.checkProposerData([proposerNameAD])
  })

  it('Verify if the address book entry of propers name is removed, then the name given during its creation shows again', () => {
    proposer.checkProposerData([proposerName])
  })

  it('Verify Proposers cannot see the "Batched tx" button in the header', () => {
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer2)
    proposer.verifyBatchDoesNotExist()
  })

  it('Verify a tx with the "proposal" status shows a message about being created by a proposer', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + proposedTx)
    proposer.verifyPropsalStatusExists()
    proposer.verifyProposedTxMsgVisible()
  })

  it('Verify a tx with the "proposal" status shows the details of a proposer', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + proposedTx)
    proposer.verifyProposerInTxActionList(proposerAddress2)
  })
})
