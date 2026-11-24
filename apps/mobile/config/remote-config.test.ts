import * as fs from 'fs'
import * as path from 'path'
import Ajv2020 from 'ajv/dist/2020'
import { FEATURES } from '@safe-global/utils/utils/chains'
import decl from './remote-config.json'
import schema from './remote-config.schema.json'

const enumKeys = new Set<string>(Object.values(FEATURES))
const declaredKeys = decl.features.map((f) => f.key)

const MOBILE_SRC = path.join(__dirname, '..', 'src')

/**
 * Collects every `FEATURES.<KEY>` member access referenced in the mobile app
 * source (excluding tests/stories), so the declaration can be kept in lockstep
 * with what the code actually uses. All mobile FEATURES imports come from
 * `@safe-global/utils/utils/chains`, so the access is unambiguous.
 */
const collectUsedFeatureKeys = (dir: string): Set<string> => {
  const used = new Set<string>()
  const entries = fs.readdirSync(dir, { recursive: true, encoding: 'utf-8' })
  for (const rel of entries) {
    if (!/\.(ts|tsx)$/.test(rel) || /\.(test|spec|stories)\.(ts|tsx)$/.test(rel)) {
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
  return used
}

const usedKeys = collectUsedFeatureKeys(MOBILE_SRC)

describe('MOBILE remote-config declaration', () => {
  it('validates against remote-config.schema.json', () => {
    const ajv = new Ajv2020({ allErrors: true })
    const validate = ajv.compile(schema)
    const valid = validate(decl)
    expect(validate.errors ?? []).toEqual([])
    expect(valid).toBe(true)
  })

  it('declares the MOBILE service', () => {
    expect(decl.service).toBe('MOBILE')
  })

  it('has no duplicate feature keys', () => {
    expect(new Set(declaredKeys).size).toBe(declaredKeys.length)
  })

  // Mobile declares a subset of the shared FEATURES enum (not every key is used on mobile).
  it('every declared key is a valid FEATURES value', () => {
    const unknown = declaredKeys.filter((k) => !enumKeys.has(k))
    expect(unknown).toEqual([])
  })

  // Drift detection: the declaration must stay in lockstep with the features the
  // mobile source actually references via FEATURES.<KEY>.
  it('every FEATURES key used in mobile source is declared', () => {
    const undeclared = [...usedKeys].filter((k) => !declaredKeys.includes(k))
    expect(undeclared).toEqual([])
  })

  it('every declared key is actually used in mobile source (no dead declarations)', () => {
    const unused = declaredKeys.filter((k) => !usedKeys.has(k))
    expect(unused).toEqual([])
  })
})
