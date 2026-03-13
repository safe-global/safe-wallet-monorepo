/**
 * Validates MSW fixture data against the OpenAPI schema.
 *
 * Catches drift between the CGW API and the fixture files used in
 * Storybook stories and Jest tests. If a fixture becomes stale
 * (e.g. a required field was added upstream), this test fails with
 * a clear message showing the fixture, schema, and validation error.
 */
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively convert OpenAPI 3.0 `nullable: true` to JSON Schema `type: [..., "null"]` */
function convertNullable(obj: Record<string, unknown>): void {
  if (typeof obj !== 'object' || obj === null) return

  if (obj.nullable === true) {
    delete obj.nullable
    if (typeof obj.type === 'string') {
      obj.type = [obj.type, 'null']
    } else if (!obj.type && (obj.$ref || obj.oneOf || obj.anyOf || obj.allOf)) {
      // nullable ref or composed type — wrap in anyOf with null
      const existing = { ...obj }
      delete existing.nullable
      Object.keys(obj).forEach((k) => delete obj[k])
      obj.anyOf = [existing, { type: 'null' }]
      return
    }
  }

  // oneOf with single item → unwrap (OpenAPI codegen quirk)
  if (Array.isArray(obj.oneOf) && (obj.oneOf as unknown[]).length === 1) {
    const inner = (obj.oneOf as Record<string, unknown>[])[0]
    delete obj.oneOf
    Object.assign(obj, inner)
  }

  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'object' && item !== null) convertNullable(item as Record<string, unknown>)
        })
      } else {
        convertNullable(value as Record<string, unknown>)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Schema setup
// ---------------------------------------------------------------------------

const SCHEMA_PATH = path.resolve(__dirname, '../../../../../packages/store/scripts/api-schema/schema.json')
const FIXTURES_ROOT = path.resolve(__dirname, '../../../../../config/test/msw/fixtures')

function loadSchema(): Record<string, unknown> {
  const raw = fs.readFileSync(SCHEMA_PATH, 'utf8')
  return JSON.parse(raw)
}

function createValidator() {
  const schema = loadSchema()
  const components = (schema.components as Record<string, unknown>)?.schemas as Record<string, Record<string, unknown>>

  // Deep-clone and convert nullable for ajv compatibility
  const converted = JSON.parse(JSON.stringify(components)) as Record<string, Record<string, unknown>>
  for (const def of Object.values(converted)) {
    convertNullable(def)
  }

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    // Allow additional properties by default (API may return fields not yet in schema)
    // We care about *required* fields and *type* correctness
  })
  addFormats(ajv)

  // Register all component schemas so $ref resolution works
  for (const [name, def] of Object.entries(converted)) {
    ajv.addSchema(def, `#/components/schemas/${name}`)
  }

  return ajv
}

function loadFixture(relativePath: string): unknown {
  const fullPath = path.join(FIXTURES_ROOT, relativePath)
  const raw = fs.readFileSync(fullPath, 'utf8')
  return JSON.parse(raw)
}

// ---------------------------------------------------------------------------
// Test matrix: [fixture path, schema ref, description]
// ---------------------------------------------------------------------------

interface FixtureTestCase {
  fixture: string
  schemaRef: string
  description: string
  isArray?: boolean
}

const FIXTURE_CASES: FixtureTestCase[] = [
  // Balances
  { fixture: 'balances/ef-safe.json', schemaRef: '#/components/schemas/Balances', description: 'efSafe balances' },
  { fixture: 'balances/vitalik.json', schemaRef: '#/components/schemas/Balances', description: 'vitalik balances' },
  {
    fixture: 'balances/spam-tokens.json',
    schemaRef: '#/components/schemas/Balances',
    description: 'spamTokens balances',
  },
  {
    fixture: 'balances/safe-token-holder.json',
    schemaRef: '#/components/schemas/Balances',
    description: 'safeTokenHolder balances',
  },
  { fixture: 'balances/empty.json', schemaRef: '#/components/schemas/Balances', description: 'empty balances' },

  // Portfolio
  { fixture: 'portfolio/ef-safe.json', schemaRef: '#/components/schemas/Portfolio', description: 'efSafe portfolio' },
  { fixture: 'portfolio/vitalik.json', schemaRef: '#/components/schemas/Portfolio', description: 'vitalik portfolio' },
  {
    fixture: 'portfolio/spam-tokens.json',
    schemaRef: '#/components/schemas/Portfolio',
    description: 'spamTokens portfolio',
  },
  {
    fixture: 'portfolio/safe-token-holder.json',
    schemaRef: '#/components/schemas/Portfolio',
    description: 'safeTokenHolder portfolio',
  },
  { fixture: 'portfolio/empty.json', schemaRef: '#/components/schemas/Portfolio', description: 'empty portfolio' },

  // Positions (array of Protocol)
  {
    fixture: 'positions/ef-safe.json',
    schemaRef: '#/components/schemas/Protocol',
    description: 'efSafe positions',
    isArray: true,
  },
  {
    fixture: 'positions/vitalik.json',
    schemaRef: '#/components/schemas/Protocol',
    description: 'vitalik positions',
    isArray: true,
  },
  {
    fixture: 'positions/spam-tokens.json',
    schemaRef: '#/components/schemas/Protocol',
    description: 'spamTokens positions',
    isArray: true,
  },
  {
    fixture: 'positions/safe-token-holder.json',
    schemaRef: '#/components/schemas/Protocol',
    description: 'safeTokenHolder positions',
    isArray: true,
  },
  {
    fixture: 'positions/empty.json',
    schemaRef: '#/components/schemas/Protocol',
    description: 'empty positions',
    isArray: true,
  },

  // Safes
  { fixture: 'safes/ef-safe.json', schemaRef: '#/components/schemas/SafeState', description: 'efSafe safe info' },
  { fixture: 'safes/vitalik.json', schemaRef: '#/components/schemas/SafeState', description: 'vitalik safe info' },
  {
    fixture: 'safes/spam-tokens.json',
    schemaRef: '#/components/schemas/SafeState',
    description: 'spamTokens safe info',
  },
  {
    fixture: 'safes/safe-token-holder.json',
    schemaRef: '#/components/schemas/SafeState',
    description: 'safeTokenHolder safe info',
  },

  // Chains
  { fixture: 'chains/mainnet.json', schemaRef: '#/components/schemas/Chain', description: 'mainnet chain' },
  { fixture: 'chains/all.json', schemaRef: '#/components/schemas/ChainPage', description: 'all chains page' },

  // Safe Apps
  {
    fixture: 'safe-apps/mainnet.json',
    schemaRef: '#/components/schemas/SafeApp',
    description: 'mainnet safe apps',
    isArray: true,
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Fixture-schema validation', () => {
  const ajv = createValidator()

  it.each(FIXTURE_CASES)('$description ($fixture) matches $schemaRef', ({ fixture, schemaRef, isArray }) => {
    const data = loadFixture(fixture)
    const validate = ajv.getSchema(schemaRef)

    expect(validate).toBeDefined()

    if (isArray) {
      expect(Array.isArray(data)).toBe(true)
      ;(data as unknown[]).forEach((item, index) => {
        const valid = validate!(item)
        if (!valid) {
          fail(
            `Item [${index}] in ${fixture} failed validation:\n${ajv.errorsText(validate!.errors, { separator: '\n' })}`,
          )
        }
      })
    } else {
      const valid = validate!(data)
      if (!valid) {
        fail(`${fixture} failed validation:\n${ajv.errorsText(validate!.errors, { separator: '\n' })}`)
      }
    }
  })
})
