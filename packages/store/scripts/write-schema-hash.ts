import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const SCRIPTS_DIR = __dirname
const SCHEMA_PATH = resolve(SCRIPTS_DIR, 'api-schema/schema.json')
const HASH_FILE_PATH = resolve(SCRIPTS_DIR, '../src/gateway/AUTO_GENERATED/.schema-hash')

const contents = readFileSync(SCHEMA_PATH)
const hash = createHash('sha256').update(contents).digest('hex')

writeFileSync(HASH_FILE_PATH, hash + '\n')
console.log(`Wrote schema hash to ${HASH_FILE_PATH}`)
