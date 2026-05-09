import { createMigrate, MigrationManifest } from 'redux-persist'
import { PersistedState } from 'redux-persist/es/types'

// Types representing the persisted shape at migration time
interface PersistedContact {
  value: string
  name: string
  chainIds?: string[]
}

interface PersistedSafeOverview {
  owners?: { value: string }[]
}

type PersistedRootState = {
  addressBook?: { contacts: Record<string, PersistedContact> }
  safes?: Record<string, Record<string, PersistedSafeOverview>>
} & Record<string, unknown>

type SafesMap = Record<string, Record<string, PersistedSafeOverview>>

/** Map each Safe address (lowercase) to the chains it is deployed on. */
function buildSafeChainMap(safes: SafesMap): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const [address, chainMap] of Object.entries(safes)) {
    map.set(address.toLowerCase(), Object.keys(chainMap))
  }
  return map
}

/** Map each signer address (lowercase) to the chains where it is an owner. */
function buildSignerChainMap(safes: SafesMap): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const chainMap of Object.values(safes)) {
    for (const [chainId, overview] of Object.entries(chainMap)) {
      for (const owner of overview.owners ?? []) {
        const key = owner.value.toLowerCase()
        const existing = map.get(key)
        if (existing) {
          existing.add(chainId)
        } else {
          map.set(key, new Set([chainId]))
        }
      }
    }
  }
  return map
}

/** Backfill `chainIds` on contacts that currently have none. */
function backfillContactChainIds(
  contacts: Record<string, PersistedContact>,
  safeChainMap: Map<string, string[]>,
  signerChainMap: Map<string, Set<string>>,
): void {
  for (const [key, contact] of Object.entries(contacts)) {
    if ((contact.chainIds?.length ?? 0) > 0) {
      continue
    }

    const addr = contact.value.toLowerCase()
    const safeChains = safeChainMap.get(addr)
    if (safeChains?.length) {
      contacts[key] = { ...contact, chainIds: safeChains }
      continue
    }

    const signerChains = signerChainMap.get(addr)
    if (signerChains?.size) {
      contacts[key] = { ...contact, chainIds: [...signerChains] }
    }
  }
}

/**
 * Migration v2: Backfill chainIds on address book contacts.
 *
 * Before this migration, all Safe and signer contacts were stored with
 * `chainIds: []` ("all networks"). This is dangerous for Safe addresses
 * because sending to a Safe on a chain where it is not deployed causes
 * fund loss.
 *
 * This migration cross-references persisted `safesSlice` data to set
 * accurate `chainIds` on:
 * 1. Safe contacts -- set to the chains the Safe is deployed on
 * 2. Signer contacts -- set to the union of chains from Safes they own
 */
const migrateV2 = (state: PersistedState): PersistedState => {
  const root = state as PersistedRootState
  if (!root?.safes || !root?.addressBook?.contacts) {
    return state
  }

  const safeChainMap = buildSafeChainMap(root.safes)
  const signerChainMap = buildSignerChainMap(root.safes)
  backfillContactChainIds(root.addressBook.contacts, safeChainMap, signerChainMap)

  return state
}

/**
 * Migration v3: Backfill dataCollectionConsented for existing users.
 *
 * Users who already have an `activeSafe` must have gone through the
 * GetStarted screen (where Crashlytics/analytics consent is granted).
 * Set `dataCollectionConsented = true` so Datadog consent is restored
 * without requiring them to re-consent.
 */
const migrateV3 = (state: PersistedState): PersistedState => {
  const root = state as PersistedRootState & {
    activeSafe?: unknown
    settings?: { dataCollectionConsented?: boolean }
  }
  if (!root) {
    return state
  }

  if (!root.settings) {
    return state
  }

  if (root.activeSafe) {
    root.settings.dataCollectionConsented = true
  } else {
    root.settings.dataCollectionConsented = false
  }

  return state
}

const migrations: MigrationManifest = {
  2: migrateV2,
  3: migrateV3,
}

export const migrate = createMigrate(migrations, { debug: __DEV__ })
