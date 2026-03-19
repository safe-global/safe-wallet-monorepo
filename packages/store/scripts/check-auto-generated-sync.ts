import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SCRIPTS_DIR = new URL('.', import.meta.url).pathname
const SCHEMA_PATH = resolve(SCRIPTS_DIR, 'api-schema/schema.json')
const HASH_FILE_PATH = resolve(SCRIPTS_DIR, '../src/gateway/AUTO_GENERATED/.schema-hash')

function computeSchemaHash(): string {
  const contents = readFileSync(SCHEMA_PATH)
  return createHash('sha256').update(contents).digest('hex')
}

function readStoredHash(): string | null {
  try {
    return readFileSync(HASH_FILE_PATH, 'utf-8').trim()
  } catch {
    return null
  }
}

const currentHash = computeSchemaHash()
const storedHash = readStoredHash()

if (storedHash === null) {
  console.error(
    'AUTO_GENERATED/.schema-hash not found.\n' +
      'Run `yarn workspace @safe-global/store build:dev` to regenerate AUTO_GENERATED files and update the hash.',
  )
  process.exit(1)
}

if (currentHash !== storedHash) {
  console.error(
    'AUTO_GENERATED files may be out of date.\n' +
      `Schema hash: ${currentHash}\n` +
      `Stored hash: ${storedHash}\n` +
      'Run `yarn workspace @safe-global/store build:dev` to regenerate.',
  )
  process.exit(1)
}

console.log('AUTO_GENERATED files are in sync with schema.json.')
process.exit(0)
