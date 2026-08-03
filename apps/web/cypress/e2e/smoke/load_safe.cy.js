import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as safe from '../pages/load_safe.pages'
import * as createwallet from '../pages/create_wallet.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const testSafeName = 'Test safe name'

describe('[SMOKE] Load Safe tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.loadNewSafeSepoliaUrl)
  })

  it('[SMOKE] Verify only valid Safe name can be accepted', () => {
    // alias the address input label
    cy.get('input[name="address"]').parent().prev('label').as('addressLabel')

    createwallet.verifyDefaultWalletName(createwallet.defaultSepoliaPlaceholder)
    safe.verifyIncorrectAddressErrorMessage()
    safe.inputNameAndAddress(testSafeName, staticSafes.SEP_STATIC_SAFE_4)

    safe.verifyAddressInputValue(staticSafes.SEP_STATIC_SAFE_4)
    safe.verifyNextButtonStatus('be.enabled')
  })

  it('[SMOKE] Verify names cannot have more than 50 characters', () => {
    // Wait due to re-render issues of the element
    cy.wait(5000)
    safe.inputName(main.generateRandomString(51))
    safe.verifyNameLengthErrorMessage()
  })

  // Skipped since the e2etestsafe.eth fixture expired (2025-11-28): this flow
  // additionally validates the resolved address IS a deployed Safe, so it needs
  // an ENS name pointing at SEP_STATIC_SAFE_6 — nick.eth (the replacement used
  // by the other ENS smoke specs) is an EOA. Re-enable once the team registers
  // a Sepolia name it controls for that Safe. ENS *resolution* stays covered by
  // create_tx.cy.js and spending_limits.cy.js.
  it.skip('[SMOKE] Verify ENS name is translated to a valid address', () => {
    safe.inputAddress(constants.ENS_TEST_SEPOLIA)
    safe.verifyAddressInputValue(constants.ENS_TEST_SEPOLIA_ADDRESS)
    safe.verifyNextButtonStatus('be.enabled')
  })

  it('[SMOKE] Verify safe name has a default name', () => {
    createwallet.verifyDefaultWalletName(createwallet.defaultSepoliaPlaceholder)
    cy.reload()
    createwallet.verifyDefaultWalletName(createwallet.defaultSepoliaPlaceholder)
  })

  it('[SMOKE] Verify non-smart contract address is not allowed in safe address', () => {
    safe.inputAddress(constants.DEFAULT_OWNER_ADDRESS)
    safe.verifyAddressError()
  })
})
