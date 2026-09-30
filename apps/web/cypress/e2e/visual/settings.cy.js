import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

const settingsSuite = (title, tests) => {
  describe(title, { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
    before(async () => {
      staticSafes = await getSafes(CATEGORIES.static)
    })

    beforeEach(() => {
      mockVisualTestApis()
    })

    tests()
  })
}

const screenshotSettingsPage = (label, url) => {
  it(label, () => {
    cy.visit(url + staticSafes.SEP_STATIC_SAFE_4)
    main.awaitVisualStability()
  })
}

settingsSuite('[VISUAL] Settings pages screenshots', () => {
  screenshotSettingsPage('[VISUAL] Screenshot setup page', constants.setupUrl)
  screenshotSettingsPage('[VISUAL] Screenshot appearance settings page', constants.appearanceSettingsUrl)
  screenshotSettingsPage('[VISUAL] Screenshot modules page', constants.modulesUrl)
  screenshotSettingsPage('[VISUAL] Screenshot notifications settings page', constants.notificationsUrl)
})

settingsSuite('[VISUAL] Cookie settings screenshots', () => {
  screenshotSettingsPage('[VISUAL] Screenshot cookie preferences page', constants.cookiesUrl)
})

settingsSuite('[VISUAL] Data and Security settings screenshots', () => {
  screenshotSettingsPage('[VISUAL] Screenshot data settings page', constants.dataSettingsUrl)
  screenshotSettingsPage('[VISUAL] Screenshot security settings page', constants.securityUrl)
})

settingsSuite('[VISUAL] Safe Apps settings screenshots', () => {
  screenshotSettingsPage('[VISUAL] Screenshot Safe Apps permissions settings page', constants.safeAppsSettingsUrl)
})

settingsSuite('[VISUAL] Environment variables settings screenshots', () => {
  screenshotSettingsPage('[VISUAL] Screenshot environment variables settings page', constants.envVariablesUrl)
})
