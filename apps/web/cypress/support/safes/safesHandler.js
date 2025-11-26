export const CATEGORIES = {
  funds: 'funds',
  nfts: 'nfts',
  static: 'static',
  safeapps: 'safeapps',
  recovery: 'recovery',
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
  return loadSafesModule(categoryKey).then((safes) => {
    console.log(`Loaded ${categoryKey}:`, safes)
    return safes
  })
}
