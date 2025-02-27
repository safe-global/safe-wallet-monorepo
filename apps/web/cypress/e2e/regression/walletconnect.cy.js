import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wc from '../pages/walletconnect.page.js'

let staticSafes = []

describe('Walletconnect UI tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  const views = [
    constants.BALANCE_URL,
    constants.setupUrl,
    constants.swapUrl,
    constants.createNewSafeSepoliaUrl,
    constants.transactionUrl,
    constants.transactionsHistoryUrl,
    constants.loadNewSafeSepoliaUrl,
    constants.securityUrl,
    constants.homeUrl,
    constants.balanceNftsUrl,
    constants.welcomeAccountsSepoliaUrl,
    constants.addressBookUrl,
    constants.appsUrlGeneral,
    constants.welcomeSepoliaUrl,
    constants.transactionQueueUrl,
    constants.transactionsMessagesUrl,
    constants.modulesUrl,
    constants.appsCustomUrl,
    constants.securityUrl,
    constants.appearanceSettingsUrl,
    constants.dataSettingsUrl,
    constants.notificationsUrl,
  ]

  views.forEach((link) => {
    it(`Verify clicking on WC icon shows WC modal, logo and title in view: ${link}`, () => {
      cy.visit(link + staticSafes.SEP_STATIC_SAFE_4)
      wc.clickOnWCBtn()
      wc.checkLogoAndTitleAreVisible()
    })
  })
})
