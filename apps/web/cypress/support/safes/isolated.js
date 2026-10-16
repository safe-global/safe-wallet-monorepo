import { isolatedSpecs } from '../../../e2e/environment/specs.mjs'
import { setDefaultOwnerAddress, setWalletCredentials } from '../credentials.js'
import { setSafeScenario } from './safesHandler.js'

// Each spec gets generated owners with its scenario, and they replace the staging wallets.
function applyScenario(scenario) {
  setWalletCredentials(scenario.credentials)
  setDefaultOwnerAddress(scenario.credentials.OWNER_4_WALLET_ADDRESS)
  setSafeScenario(scenario)
}

if (Cypress.expose('SAFE_E2E_ISOLATED')) {
  const spec = isolatedSpecs[Cypress.spec.relative] ?? {}
  const prepareScenario = () =>
    cy.task('prepareSafeScenario', Cypress.spec.relative, { log: false }).then(applyScenario)

  before(prepareScenario)

  let firstTest = true
  beforeEach(function () {
    if (spec.skips && Object.hasOwn(spec.skips, this.currentTest.title)) this.skip()
    if (spec.perTest && !firstTest) return prepareScenario()
    firstTest = false
  })
}
