import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import * as wallet from '../../support/utils/wallet.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe(
  '[VISUAL] Owner management screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    beforeEach(() => {
      mockVisualTestApis()
      cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
      wallet.connectSigner(signer)
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot add new signer form', () => {
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot add signer with invalid address error', () => {
      owner.openManageSignersWindow()
      owner.clickOnAddSignerBtn()
      owner.typeOwnerAddressManage(1, main.generateRandomString(10))
      main.awaitVisualStability()
    })

    it('[VISUAL] Screenshot replace signer dialog', () => {
      owner.openReplaceOwnerWindow(0)
      main.awaitVisualStability()
    })
  },
)
