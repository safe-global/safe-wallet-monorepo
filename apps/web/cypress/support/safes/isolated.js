import { isolatedSpecs } from '../../../e2e/environment/specs.mjs'
import { setSafeScenario } from './safesHandler.js'

if (Cypress.env('SAFE_E2E_ISOLATED')) {
  const spec = isolatedSpecs[Cypress.spec.relative] ?? {}
  const prepareScenario = () =>
    cy.task('prepareSafeScenario', Cypress.spec.relative, { log: false }).then(setSafeScenario)

  before(prepareScenario)

  let firstTest = true
  beforeEach(function () {
    if (spec.skips && Object.hasOwn(spec.skips, this.currentTest.title)) this.skip()
    if (spec.perTest && !firstTest) return prepareScenario()
    firstTest = false
  })
}
