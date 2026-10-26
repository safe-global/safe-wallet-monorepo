import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as ls from '../../support/localstorage_data.js'
import * as proposer from '../pages/proposers.pages.js'
import proposerData from '../../fixtures/proposers.js'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []
let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})
const proposerNameAD = 'AD Proposer1'
const proposerNameAD2 = 'AD Proposer2'

describe('Proposers tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    proposer.disableProposerGating()
    wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
  })

  it('Verify that a proposer cannot be the safe itself', () => {
    proposer.clickOnAddProposerBtn()
    proposer.enterProposerData(staticSafes.SEP_STATIC_SAFE_31.substring(4), main.generateRandomString(5))
    proposer.checkSafeAsProposerErrorMessage()
  })

  it('Verify a proposer Creator is shown in the table', () => {
    proposer.checkCreatorAddress([proposerData.creator])
  })

  describe('With a pre-seeded address book', () => {
    it('Verify that the address book name of the proposers overwrites the name given during its creation', () => {
      wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31, {
        extraStorage: { [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.proposers },
      })
      cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
      proposer.checkProposerData([proposerNameAD])
    })
  })
})
