import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as proposer from '../pages/proposers.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as assets from '../pages/assets.pages.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import proposerData from '../../fixtures/proposers.js'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []
let signer2
before(() => {
  signer2 = walletCredentials.OWNER_1_PRIVATE_KEY
})
const sendValue = 0.000001

describe('Proposers 2 tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify a proposers is capable of propose transactions', () => {
    wallet.connectSignerViaStorage(signer2, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_33)
    assets.toggleHideDust(false)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(getMockAddress())
    createtx.setSendValue(sendValue)
    createtx.clickOnNextBtn()
    createtx.verifySubmitBtnIsEnabled()
  })

  it('Verify a proposer can rename any proposer, as renaming is a local address book edit', () => {
    wallet.connectSignerViaStorage(signer2, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31)
    proposer.verifyEditProposerBtnEnabled(proposerData.delegate)
  })
})
