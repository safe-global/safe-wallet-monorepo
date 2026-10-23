import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import * as recovery from '../pages/recovery.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []
let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})

describe('Recovery regression tests 2', { defaultCommandTimeout: 50000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that there is validation for the Guardian address field', () => {
    cy.visit(constants.securityUrl + staticSafes.SEP_STATIC_SAFE_13)
    cy.clearLocalStorage()
    wallet.connectSignerViaStorage(signer)
    main.acceptCookies()
    recovery.clickOnSetupRecoveryBtn()
    recovery.clickOnNextBtn()

    recovery.enterRecovererAddress(main.generateRandomString(10), 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)

    recovery.enterRecovererAddress(getMockAddress().replace('A', 'a'), 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    recovery.enterRecovererAddress(constants.ENS_TEST_SEPOLIA_INVALID, 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.failedResolve)

    recovery.enterRecovererAddress(staticSafes.SEP_STATIC_SAFE_13, 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownSafeGuardian)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })
})
