import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as header from '../pages/header.page.js'
import * as notifications from '../pages/notifications.page.js'

let staticSafes = []

describe('Notifications UI tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  const views = [
    constants.BALANCE_URL,
    constants.setupUrl,
    constants.swapUrl,
    constants.createNewSafeSepoliaUrl,
    constants.loadNewSafeSepoliaUrl,
    constants.transactionUrl,
    constants.transactionsHistoryUrl,
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
    it(`Verify clicking on notifications center opens notifications modal in view: ${link}`, () => {
      cy.visit(link + staticSafes.SEP_STATIC_SAFE_4)
      header.openNotificationCenter()
      notifications.checkCoreElementsVisible()
    })
  })
})
