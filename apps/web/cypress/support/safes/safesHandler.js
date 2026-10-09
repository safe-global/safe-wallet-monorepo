export const CATEGORIES = {
  funds: 'funds',
  nfts: 'nfts',
  static: 'static',
  safeapps: 'safeapps',
  recovery: 'recovery',
}

export function setSafeScenario(scenario) {
  const isolatedSafes = Cypress.expose('SAFE_E2E_SAFES') ?? {}
  // Keep references held by spec-level before hooks current after a scenario reset.
  for (const category of new Set([...Object.keys(isolatedSafes), ...Object.keys(scenario.safes)])) {
    const safes = (isolatedSafes[category] ??= {})
    for (const key of Object.keys(safes)) delete safes[key]
    Object.assign(safes, scenario.safes[category])
    if (!Object.hasOwn(scenario.safes, category)) delete isolatedSafes[category]
  }
  Cypress.expose('SAFE_E2E_SAFES', isolatedSafes)
  Cypress.expose('SAFE_E2E_FIXTURES', scenario.fixtures ?? {})
}

function loadSafesModule(categoryKey) {
  const category = CATEGORIES[categoryKey]
  if (!category) {
    throw new Error(`Category key '${categoryKey}' is not recognized.`)
  }

  if (category === 'static') {
    return import('../../fixtures/safes/static.js').then((module) => module.default)
  }

  return cy.fixture(`safes/${category}.json`).then((data) => {
    return data
  })
}

export function getSafes(categoryKey) {
  if (Cypress.expose('SAFE_E2E_ISOLATED')) {
    const safes = Cypress.expose('SAFE_E2E_SAFES')?.[categoryKey]
    if (!safes) throw new Error(`No prepared isolated Safes for category ${categoryKey}`)
    return Promise.resolve(safes)
  }
  return loadSafesModule(categoryKey).then((safes) => {
    console.log(`Loaded ${categoryKey}:`, safes)
    return safes
  })
}
