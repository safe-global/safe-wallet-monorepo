import * as fs from 'fs'
import * as path from 'path'
import Ajv2020 from 'ajv/dist/2020'
import { FEATURES } from '@safe-global/utils/utils/chains'
import decl from './remote-config.json'
import schema from './remote-config.schema.json'
import mobileDecl from '../../mobile/config/remote-config.json'
import testChainFeatures from '../e2e/environment/infra/scripts/cfg_management/test-chain-features.json'

const enumKeys = new Set<string>(Object.values(FEATURES))
const declaredKeys = decl.features.map((f) => f.key)

const REPO_ROOT = path.join(__dirname, '..', '..', '..')
const WEB_SOURCE_DIRS = ['apps/web/src', 'packages/utils/src', 'packages/store/src'].map((dir) =>
  path.join(REPO_ROOT, dir),
)

const isProductionSource = (rel: string): boolean =>
  /\.(ts|tsx)$/.test(rel) &&
  !/\.(test|spec|stories)\.(ts|tsx)$/.test(rel) &&
  !/(^|\/)(tests|__tests__|__mocks__)\//.test(rel)

/**
 * Collects every `FEATURES.<KEY>` member access in the web app and the shared
 * packages it uses (excluding tests, mocks and stories), so the declaration stays
 * in lockstep with what the code reads.
 */
const collectUsedFeatureKeys = (dirs: string[]): Set<string> => {
  const used = new Set<string>()
  for (const dir of dirs) {
    const entries = fs.readdirSync(dir, { recursive: true, encoding: 'utf-8' })
    for (const rel of entries) {
      if (!isProductionSource(rel)) {
        continue
      }
      const full = path.join(dir, rel)
      if (!fs.statSync(full).isFile()) {
        continue
      }
      const source = fs.readFileSync(full, 'utf-8')
      for (const match of source.matchAll(/\bFEATURES\.([A-Z0-9_]+)/g)) {
        used.add(match[1])
      }
    }
  }
  return used
}

// packages/utils/src/utils/ens.ts spells this key as a string to stay free of the FEATURES import
const KEYS_READ_AS_STRINGS = ['DOMAIN_LOOKUP']

const usedKeys = new Set([...collectUsedFeatureKeys(WEB_SOURCE_DIRS), ...KEYS_READ_AS_STRINGS])

describe('WALLET_WEB remote-config declaration', () => {
  it('validates against remote-config.schema.json', () => {
    const ajv = new Ajv2020({ allErrors: true })
    const validate = ajv.compile(schema)
    const valid = validate(decl)
    expect(validate.errors ?? []).toEqual([])
    expect(valid).toBe(true)
  })

  it('declares the WALLET_WEB service', () => {
    expect(decl.service).toBe('WALLET_WEB')
  })

  it('has no duplicate feature keys', () => {
    expect(new Set(declaredKeys).size).toBe(declaredKeys.length)
  })

  it('every declared key is a valid FEATURES value', () => {
    const unknown = declaredKeys.filter((k) => !enumKeys.has(k))
    expect(unknown).toEqual([])
  })

  it('every FEATURES key used in web source is declared', () => {
    const undeclared = [...usedKeys].filter((k) => !declaredKeys.includes(k))
    expect(undeclared).toEqual([])
  })

  it('every declared key is actually used in web source (no dead declarations)', () => {
    const unused = declaredKeys.filter((k) => !usedKeys.has(k))
    expect(unused).toEqual([])
  })

  // A key shared with mobile is one Feature row in the Config Service, so both files must agree.
  it('declares a key shared with mobile with the same description, scope and enabled', () => {
    const mobileByKey = new Map(mobileDecl.features.map((f) => [f.key, f]))
    const mismatched = decl.features
      .filter((f) => mobileByKey.has(f.key))
      .filter((f) => {
        const mobile = mobileByKey.get(f.key)
        return mobile?.description !== f.description || mobile?.scope !== f.scope || mobile?.enabled !== f.enabled
      })
      .map((f) => f.key)
    expect(mismatched).toEqual([])
  })
})

describe('E2E test-chain flags (test-chain-features.json)', () => {
  const onKeys: string[] = testChainFeatures.on
  const offReasons: Record<string, string> = testChainFeatures.off
  const offKeys = Object.keys(offReasons)

  it('switches every declared flag on or gives a reason to keep it off', () => {
    const undecided = declaredKeys.filter((k) => !onKeys.includes(k) && !offKeys.includes(k))
    expect(undecided).toEqual([])
  })

  it('does not list a flag as both on and off', () => {
    expect(onKeys.filter((k) => offKeys.includes(k))).toEqual([])
  })

  it('has no duplicate on keys', () => {
    expect(new Set(onKeys).size).toBe(onKeys.length)
  })

  it('gives reasons only for declared flags', () => {
    expect(offKeys.filter((k) => !declaredKeys.includes(k))).toEqual([])
  })

  it('gives a non-empty reason for every off flag', () => {
    expect(offKeys.filter((k) => offReasons[k].trim() === '')).toEqual([])
  })
})
