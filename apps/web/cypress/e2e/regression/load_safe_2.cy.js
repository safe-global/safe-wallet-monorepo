import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as safe from '../pages/load_safe.pages'
import * as ls from '../../support/localstorage_data.js'
import * as owner from '../pages/owners.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { getMockAddress } from '../../support/utils/ethers.js'

let staticSafes,
  fundSafes = []

const ownerNames = ['Automation owner']
const ownerSepolia = ['Automation owner Sepolia']
const ownerEth = ['Automation owner Eth']

const seedStorage = (entries) => (win) => {
  Object.entries(entries).forEach(([key, value]) => win.localStorage.setItem(key, JSON.stringify(value)))
}

describe('Load Safe tests 2', () => {
  before(() => {
    getSafes(CATEGORIES.funds)
      .then((funds) => {
        fundSafes = funds
        return getSafes(CATEGORIES.static)
      })
      .then((statics) => {
        staticSafes = statics
      })
  })

  describe('Without pre-seeded data', () => {
    beforeEach(() => {
      cy.visit(constants.loadNewSafeSepoliaUrl)
      cy.wait(2000)
    })

    it('Verify Safe address checksum', () => {
      safe.verifyAddressCheckSum(staticSafes.SEP_STATIC_SAFE_13)
      safe.verifyAddressInputValue(staticSafes.SEP_STATIC_SAFE_13)
      safe.inputAddress(staticSafes.SEP_STATIC_SAFE_13.split(':')[1].toLowerCase())
      safe.verifyAddressInputValue(staticSafes.SEP_STATIC_SAFE_13)
    })

    it('Verify owner name cannot be longer than 50 characters', () => {
      safe.inputAddress(staticSafes.SEP_STATIC_SAFE_13)
      safe.clickOnNextBtn()
      safe.inputOwnerName(0, main.generateRandomString(51))
      owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.exceedChars)
    })

    it('Verify names with primary ENS name are filled by default', () => {
      safe.inputAddress(staticSafes.SEP_STATIC_SAFE_13)
      safe.clickOnNextBtn()
      safe.verifyOnwerNameENS(1, constants.ENS_TEST_SEPOLIA_VALID)
    })

    it('Verify random text is in the safe address input is not allowed', () => {
      safe.inputAddress(main.generateRandomString(10))
      owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)
    })

    it('Verify a valid address can be entered', () => {
      safe.inputAddress(getMockAddress())
      safe.verifyAddresFormatIsValid()
    })

    it('Verify that the wrong prefix is not allowed', () => {
      safe.inputAddress(`eth:${getMockAddress()}`)
      owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.prefixMismatch)
      safe.verifyNextButtonStatus(constants.enabledStates.disabled)
    })
  })

  describe('With pre-seeded data', () => {
    it('Verify names in address book are filled by default from address book', () => {
      cy.visit(constants.loadNewSafeSepoliaUrl, {
        onBeforeLoad: seedStorage({
          [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.sameOwnerName,
        }),
      })
      safe.inputAddress(staticSafes.SEP_STATIC_SAFE_13)
      safe.clickOnNextBtn()
      safe.verifyOwnerNames(ownerNames)
      safe.verifyOnwerInputIsNotEmpty(0)
    })

    it('Verify correct owner names are displayed for certain networks', () => {
      cy.visit(constants.loadNewSafeSepoliaUrl, {
        onBeforeLoad: seedStorage({
          [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.sameOwnerName,
        }),
      })
      safe.clickNetworkSelector(constants.networks.sepolia)
      safe.selectEth()
      safe.inputAddress(fundSafes.ETH_FUNDS_SAFE_13)
      safe.clickOnNextBtn()
      safe.verifyOwnerNames(ownerEth)
      safe.clickOnBackBtn()
      safe.clickNetworkSelector(constants.networks.ethereum)
      safe.selectSepolia()
      safe.inputAddress(staticSafes.SEP_STATIC_SAFE_13)
      safe.clickOnNextBtn()
      safe.verifyOwnerNames(ownerSepolia)
    })

    it('Verify that safes already added to the watchlist cannot be added again', () => {
      cy.visit(constants.loadNewSafeSepoliaUrl, {
        onBeforeLoad: seedStorage({ [constants.localStorageKeys.SAFE_v2__addedSafes]: ls.addedSafes.set1 }),
      })
      safe.inputAddress(staticSafes.SEP_STATIC_SAFE_13)
      owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.safeAlreadyAdded)
      safe.verifyNextButtonStatus(constants.enabledStates.disabled)
    })
  })
})
