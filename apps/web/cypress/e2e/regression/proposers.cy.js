import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import * as ls from '../../support/localstorage_data.js'
import * as proposer from '../pages/proposers.pages.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import proposerData from '../../fixtures/proposers.js'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []
let signer, signer2, signerAddress
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
  signer2 = walletCredentials.OWNER_1_PRIVATE_KEY
  signerAddress = walletCredentials.OWNER_4_WALLET_ADDRESS
})
const proposerNameAD = 'AD Proposer1'
const proposerNameAD2 = 'AD Proposer2'
const migratedProposerName = 'Name held by the Transaction Service'

describe('Proposers tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    proposer.disableProposerGating()
    wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
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
    proposer.checkCreatorAddress([proposerData.creator])
  })

  it('Verify non-creators of a proposers cannot delete it', () => {
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer2)
    proposer.verifyDeleteProposerBtnIsDisabled(proposerData.creator)
  })

  it('Verify a proposer name still held by the Transaction Service is migrated into the address book', () => {
    cy.intercept('GET', constants.delegatesEndpoint, {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          safe: staticSafes.SEP_STATIC_SAFE_31.substring(4),
          delegate: signerAddress,
          delegator: signerAddress,
          label: migratedProposerName,
        },
      ],
    })
    // Earlier tests in this spec leave migrated names in the address book, and the migration skips
    // delegates it already has, so this test only means anything against an empty book.
    wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31, {
      extraStorage: { [constants.localStorageKeys.SAFE_v2__addressBook]: {} },
    })

    proposer.checkProposerData([migratedProposerName])
  })

  it('Verify Proposers cannot see the "Batched tx" button in the header', () => {
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer2)
    proposer.verifyBatchDoesNotExist()
  })

  it('Verify a tx with the "proposal" status shows a message about being created by a proposer', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + proposerData.proposedTx)
    proposer.verifyPropsalStatusExists()
    proposer.verifyProposedTxMsgVisible()
  })

  it('Verify a tx with the "proposal" status shows the details of a proposer', () => {
    wallet.connectSignerViaStorage(
      signer,
      constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_31 + proposerData.proposedTx,
      {
        extraStorage: { [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.proposers },
      },
    )

    proposer.verifyProposerInTxActionList(proposerNameAD2)
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

describe('Proposers tests with the Safe Pro gate', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify Safe Pro replaces the "Add proposer" button when no Workspace plan grants policies', () => {
    wallet.connectSignerViaStorage(signer, constants.setupUrl + staticSafes.SEP_STATIC_SAFE_31)
    cy.contains(owner.safeAccountNonceStr, { timeout: 10000 })
    proposer.verifyAddProposerIsLocked()
  })
})
