import Ajv2020 from 'ajv/dist/2020'
import { FEATURES } from '@safe-global/utils/utils/chains'
import decl from './remote-config.json'
import schema from './remote-config.schema.json'

const enumKeys = new Set<string>(Object.values(FEATURES))
const declaredKeys = decl.features.map((f) => f.key)

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
})
