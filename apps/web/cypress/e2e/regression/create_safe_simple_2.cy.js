import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createwallet from '../pages/create_wallet.pages'
import * as owner from '../pages/owners.pages'
import * as ls from '../../support/localstorage_data.js'
import * as safe from '../pages/load_safe.pages'
import * as wallet from '../../support/utils/wallet.js'
import { walletCredentials } from '../../support/credentials.js'

const ownerSepolia = ['Automation owner Sepolia']
let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})

describe('Safe creation tests 2', () => {
  beforeEach(() => {
    createwallet.startCreateSafeFlow(signer)
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
})
