import { randomUUID } from 'node:crypto'
import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'

// A relative path to a JSON file inside the fixtures folder; no absolute paths, backslashes or dot segments.
const isFixturePath = (name) =>
  !isAbsolute(name) &&
  !name.includes('\\') &&
  name.split('/').every((part) => part !== '..' && part !== '.') &&
  name.endsWith('.json')

export function createScenarioFixtures(source) {
  const directory = join(tmpdir(), `safe-e2e-fixtures-${randomUUID()}`)
  const cleanup = () => rm(directory, { recursive: true, force: true })
  const prepare = async (files = {}) => {
    for (const name of Object.keys(files)) {
      if (!isFixturePath(name)) throw new Error(`Scenario fixture ${name} must name an existing JSON fixture file`)
      await readFile(join(source, name))
    }
    const serialized = Object.entries(files).map(([name, value]) => {
      const json = JSON.stringify(value)
      if (json === undefined) throw new TypeError(`Scenario fixture ${name} must contain JSON data`)
      return [name, json]
    })
    try {
      await cleanup()
      await cp(source, directory, { recursive: true, dereference: true })
      for (const [name, value] of serialized) {
        await writeFile(join(directory, name), value)
      }
    } catch (error) {
      await cleanup()
      throw error
    }
  }
  return { directory, prepare, cleanup }
}
