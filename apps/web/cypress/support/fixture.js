import stagingSafes from '../fixtures/safes/static.js'

export function fixtureValue(key, fallback) {
  return Cypress.env('SAFE_E2E_FIXTURES')?.[key] ?? fallback
}

/** Properties that read the scenario fixtures `${namespace}.${name}` and fall back to the staging `defaults`. */
export function fixtureGetters(namespace, defaults) {
  const properties = Object.entries(defaults).map(([name, fallback]) => [
    name,
    { enumerable: true, get: () => fixtureValue(`${namespace}.${name}`, fallback) },
  ])
  return Object.defineProperties({}, Object.fromEntries(properties))
}

export function storageFixture(key, fallback) {
  return Object.defineProperty({ ...fallback }, 'toJSON', { value: () => fixtureValue(key, fallback) })
}

const addressOf = (safe) => safe.split(':').at(-1)

// Staging static Safe addresses map to the Safes the scenario prepared under the same keys.
function addressAliases() {
  const prepared = Object.entries(Cypress.env('SAFE_E2E_SAFES')?.static ?? {}).filter(([key]) => stagingSafes[key])
  return Object.fromEntries(prepared.map(([key, safe]) => [addressOf(stagingSafes[key]), addressOf(safe)]))
}

// Serializes captured storage data with staging addresses replaced by the scenario's own addresses.
export function aliasedStorage(value) {
  return Object.defineProperty({ ...value }, 'toJSON', {
    value: () => {
      let json = JSON.stringify(value)
      for (const [staging, local] of Object.entries(addressAliases())) json = json.replaceAll(staging, local)
      return JSON.parse(json)
    },
  })
}
