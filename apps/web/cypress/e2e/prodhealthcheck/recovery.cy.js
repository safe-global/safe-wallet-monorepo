import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as recovery from '../pages/recovery.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let recoverySafes,
  staticSafes = []

describe('[PROD] Production recovery health check tests', { defaultCommandTimeout: 50000 }, () => {
  before(() => {
    getSafes(CATEGORIES.recovery)
      .then((recoveries) => {
        recoverySafes = recoveries
        return getSafes(CATEGORIES.static)
      })
      .then((statics) => {
        staticSafes = statics
      })
  })


  it.skip('Verify that the Security section contains Account recovery block on supported netwroks', () => {
    const safes = [
      staticSafes.ETH_STATIC_SAFE_15,
      staticSafes.GNO_STATIC_SAFE_16,
      staticSafes.MATIC_STATIC_SAFE_17,
      staticSafes.SEP_STATIC_SAFE_13,
    ]

    safes.forEach((safe) => {
      cy.visit(constants.prodbaseUrl + constants.securityUrl + safe)
      recovery.getSetupRecoveryBtn()
    })
  })

  it('Verify that the Security and Login section does not contain Account recovery block on unsupported networks', () => {
    const safes = [
      staticSafes.BNB_STATIC_SAFE_18,
      staticSafes.AURORA_STATIC_SAFE_19,
      staticSafes.AVAX_STATIC_SAFE_20,
      staticSafes.LINEA_STATIC_SAFE_21,
      staticSafes.ZKSYNC_STATIC_SAFE_22,
    ]

    safes.forEach((safe) => {
      cy.visit(constants.prodbaseUrl + constants.securityUrl + safe)
      main.verifyElementsCount(recovery.setupRecoveryBtn, 0)
    })
  })
})
