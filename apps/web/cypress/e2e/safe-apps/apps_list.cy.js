import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as safeapps from '../pages/safeapps.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'

const myCustomAppTitle = 'Cypress Test App'
const myCustomAppDescrAdded = 'Cypress Test App Description'

let staticSafes = []

describe('Safe Apps list tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(`${constants.appsUrl}?safe=${staticSafes.SEP_STATIC_SAFE_1}`, {
      failOnStatusCode: false,
    })
  })

  it('Verify app list can be filtered by app name', () => {
    // Wait for /safe-apps response
    cy.intercept('GET', constants.appsEndpoint).then(() => {
      safeapps.typeAppName(constants.appNames.txbuilder)
      safeapps.verifyLinkName(safeapps.linkNames.txBuilderLogo)
    })
  })

  it('Verify app list can be filtered by app description', () => {
    safeapps.typeAppName(constants.appNames.customContract)
    safeapps.verifyLinkName(safeapps.linkNames.txBuilderLogo)
  })

  it('Verify error message is displayed when no app found', () => {
    safeapps.typeAppName(constants.appNames.noResults)
    safeapps.verifyNoAppsTextPresent()
  })

  it('Verify apps can be pinned', () => {
    safeapps.clearSearchAppInput()
    safeapps.pinApp(0, safeapps.transactionBuilderStr)
    safeapps.verifyPinnedAppCount(1)
  })

  it('Verify apps can be unpinned', () => {
    safeapps.pinApp(0, safeapps.transactionBuilderStr)
    safeapps.pinApp(0, safeapps.transactionBuilderStr, false)
    safeapps.verifyPinnedAppCount(0)
  })

  it('Verify there is an error when the app manifest is invalid', () => {
    safeapps.clickOnCustomAppsTab()
    safeapps.clickOnAddCustomApp()
    safeapps.typeCustomAppUrl(`https://manifest${Math.random()}.tow`)
    safeapps.verifyAppNotSupportedMsg()
  })

  it('Verify an app can be added to the list within the custom apps section', () => {
    const url = `https://manifest${Math.random()}.com`
    const manifest = url + '/manifest.json'
    cy.intercept('GET', manifest, {
      name: constants.testAppData.name,
      description: constants.testAppData.descr,
      icons: [{ src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' }],
    })

    safeapps.clickOnCustomAppsTab()
    safeapps.clickOnAddCustomApp()
    safeapps.typeCustomAppUrl(url)
    safeapps.verifyAppTitle(myCustomAppTitle)
    safeapps.acceptTC()
    safeapps.clickOnAddBtn()
    safeapps.verifyCustomAppCount(1)
    safeapps.verifyAppDescription(myCustomAppDescrAdded)
  })

  it('Verify the featured apps list', () => {
    safeapps.verifyAppInFeaturedList(safeapps.transactionBuilderStr)
    safeapps.verifyAppInFeaturedList(safeapps.cowswapStr)
  })

  it('Verify that pinned app can be in pinned section and in featured at the same time', () => {
    safeapps.pinApp(0, safeapps.transactionBuilderStr)
    safeapps.verifyAppInFeaturedList(safeapps.transactionBuilderStr)
    safeapps.verifyAppInPinnedList(safeapps.transactionBuilderStr)
  })
})
