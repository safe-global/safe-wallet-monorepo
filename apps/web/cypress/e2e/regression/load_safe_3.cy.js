import 'cypress-file-upload'
import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as safe from '../pages/load_safe.pages.js'
import * as createwallet from '../pages/create_wallet.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const testSafeName = 'Test safe name'
const testOwnerName = 'Test Owner Name'

describe('Load Safe tests - 3', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.loadNewSafeSepoliaUrl)
  })

  it('Verify that after loading existing Safe, its name input is not empty', () => {
    safe.inputNameAndAddress(testSafeName, staticSafes.SEP_STATIC_SAFE_4)
    safe.clickOnNextBtn()
    safe.verifyOnwerInputIsNotEmpty(0)
  })

  it('Verify that when changing a network in dropdown, the same network is displayed in right top corner', () => {
    safe.clickNetworkSelector(constants.networks.sepolia)
    safe.selectPolygon()
    cy.wait(1000)
    safe.checkMainNetworkSelected(constants.networks.polygon)
  })

  it('Verify the custom Safe name is successfully loaded', () => {
    safe.inputNameAndAddress(testSafeName, staticSafes.SEP_STATIC_SAFE_3)
    safe.clickOnNextBtn()
    createwallet.typeOwnerName(testOwnerName, 0)
    safe.clickOnNextBtn()
    safe.verifyDataInReviewSection(
      testSafeName,
      testOwnerName,
      constants.commonThresholds.oneOfOne,
      constants.networks.sepolia,
      constants.SEPOLIA_OWNER_2,
    )
    safe.clickOnAddBtn()
    main.verifyHomeSafeUrl(staticSafes.SEP_STATIC_SAFE_3)
    safe.veriySidebarSafeNameIsVisible(testSafeName)
    safe.verifyOwnerNamePresentInSettings(testOwnerName)
  })

  it('Verify a network can be selected in the Safe', () => {
    safe.clickNetworkSelector(constants.networks.sepolia)
    safe.selectPolygon()
    cy.wait(2000)
    safe.clickNetworkSelector(constants.networks.polygon)
    safe.selectSepolia()
  })

  it('Verify there are mandatory networks in dropdown: Eth, Polygon, Sepolia', () => {
    safe.clickNetworkSelector(constants.networks.sepolia)
    safe.verifyMandatoryNetworksExist()
  })
})
