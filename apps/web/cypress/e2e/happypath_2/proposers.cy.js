import * as constants from '../../support/constants.js'
import * as owner from '../pages/owners.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as proposer from '../pages/proposers.pages.js'
import * as navigation from '../pages/navigation.page.js'
import proposerData from '../../fixtures/proposers.js'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []
let signer, signer3, addedProposer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
  signer3 = walletCredentials.OWNER_3_PRIVATE_KEY
  addedProposer = walletCredentials.OWNER_3_WALLET_ADDRESS
})
const proposerName2 = 'Proposer 2'
const proposerName = 'Proposer 1'
const changedProposerName = 'Changed proposer name'

describe('Happy path Proposers tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify a proposer can be renamed in the local address book by any signer', () => {
    wallet.connectSignerViaStorage(signer3, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    proposer.verifyEditProposerBtnEnabled(proposerData.creator)

    proposer.clickOnEditProposerBtn(proposerData.delegate)
    proposer.enterProposerName(changedProposerName)
    proposer.saveProposerName()
    cy.reload()
    proposer.checkProposerData([changedProposerName])

    proposer.clickOnEditProposerBtn(proposerData.delegate)
    proposer.enterProposerName(proposerName2)
    proposer.saveProposerName()
    cy.reload()
    proposer.checkProposerData([proposerName2])
  })

  it('Verify a proposer can be added', () => {
    proposer.disableProposerGating()
    wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_32)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
    proposer.deleteAllProposers()
    proposer.clickOnAddProposerBtn()
    proposer.enterProposerData(addedProposer, proposerName)
    proposer.clickOnSubmitProposerBtn()
    proposer.verifyProposerSuccessMsgDisplayed()
    cy.reload()
    proposer.checkProposerData([proposerName])
  })
})
