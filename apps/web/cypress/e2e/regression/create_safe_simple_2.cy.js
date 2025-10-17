import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createwallet from '../pages/create_wallet.pages'
import * as owner from '../pages/owners.pages'
import * as ls from '../../support/localstorage_data.js'
import * as safe from '../pages/load_safe.pages'
import * as wallet from '../../support/utils/wallet.js'

const ownerSepolia = ['Automation owner Sepolia']
const ownerName = 'Owner name'
const owner1 = 'Owner1'
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Safe creation tests 2', () => {
  beforeEach(() => {
    createwallet.startCreateSafeFlow(signer)
  })

  it('Cancel button cancels safe creation', () => {
    safe.clickOnNextBtn()
    createwallet.clickOnBackBtn()
    createwallet.cancelWalletCreation()
  })

  // Owners and confirmation step
  it('Verify Next button is disabled when address is empty', () => {
    safe.clickOnNextBtn()
    safe.clearOwnerAddress(0)
    createwallet.verifyNextBtnIsDisabled()
  })

  it('Verify owner names are autocompleted if they are present in the Address book ', () => {
    cy.wrap(null)
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sameOwnerName),
      )
      .then(() => {
        createwallet.startCreateSafeFlow(signer)
        safe.clickOnNextBtn()
        safe.verifyOwnerNamesInConfirmationStep(ownerSepolia)
      })
  })

  it("Verify names don't autofill if they are added to another chain's Address book", () => {
    cy.wrap(null)
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sameOwnerName[1]),
      )
      .then(() => {
        createwallet.startCreateSafeFlow(signer)
        safe.clickOnNextBtn()
        safe.verifyDataDoesNotExist(ownerSepolia)
      })
  })

  it('Verify an valid name for owner can be inputed', () => {
    safe.clickOnNextBtn()
    safe.inputOwnerName(0, ownerName)
    safe.verifyownerNameFormatIsValid()
  })

  it('Verify Threshold matching required confirmations max with amount of owners', () => {
    safe.clickOnNextBtn()
    safe.clickOnAddNewOwnerBtn()
    owner.verifyThreshold(1, 2)
  })

  it('Verify deleting owner rows updates the currenlty set policies value', () => {
    safe.clickOnNextBtn()
    safe.clickOnAddNewOwnerBtn()
    owner.verifyThreshold(1, 2)
    safe.clickOnRemoveOwnerBtn(0)
    owner.verifyThreshold(1, 1)
  })

  it('Verify ENS name in the address and name fields is resolved', () => {
    safe.clickOnNextBtn()
    safe.inputOwnerAddress(0, constants.ENS_TEST_SEPOLIA_VALID)
    safe.verifyOwnerAddress(0, constants.DEFAULT_OWNER_ADDRESS)
    safe.verifyOnwerNameENS(0, constants.ENS_TEST_SEPOLIA_VALID)
  })

  it('Verify deleting owner rows is possible', () => {
    safe.clickOnNextBtn()
    safe.clickOnAddNewOwnerBtn()
    safe.verifyNumberOfOwners(2)
    safe.clickOnRemoveOwnerBtn(0)
    safe.verifyNumberOfOwners(1)
  })

  it('Verify existing owner in address book will have their names filled when their address is pasted', () => {
    cy.wrap(null)
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sepoliaAddress1),
      )
      .then(() => {
        cy.visit(constants.welcomeUrl + '?chain=sep')
        wallet.connectSigner(signer)
        owner.waitForConnectionStatus()
        createwallet.clickOnCreateNewSafeBtn()
        safe.clickOnNextBtn()
        safe.inputOwnerAddress(0, constants.RECIPIENT_ADDRESS)
        safe.verifyOnwerName(0, owner1)
      })
  })
})
