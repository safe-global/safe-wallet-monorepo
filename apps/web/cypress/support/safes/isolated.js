import { setDefaultOwnerAddress, setWalletCredentials } from '../credentials.js'
import { setSafeScenario } from './safesHandler.js'

// Each spec gets generated owners with its scenario, and they replace the staging wallets.
function applyScenario(scenario) {
  setWalletCredentials(scenario.credentials)
  setDefaultOwnerAddress(scenario.credentials.OWNER_4_WALLET_ADDRESS)
  setSafeScenario(scenario)
}

if (Cypress.expose('SAFE_E2E_ISOLATED')) {
  before(() => cy.task('prepareSafeScenario', Cypress.spec.relative, { log: false }).then(applyScenario))
}
