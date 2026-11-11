import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { registryItemSchema } from 'shadcn/schema'
import { appDir } from './paths.ts'
import type { Registry } from './registry.ts'

export const outputDir = path.join(appDir, 'public/r')

export const checkRegistry = (dir: string = outputDir): string[] => {
  const errors: string[] = []
  const registry = JSON.parse(readFileSync(path.join(appDir, 'registry.json'), 'utf8')) as Registry
  const names = new Set(registry.items.map((item) => item.name))
  const files = readdirSync(dir).filter((file) => file.endsWith('.json') && file !== 'registry.json')
  for (const name of names) if (!files.includes(`${name}.json`)) errors.push(`${name}: no ${name}.json in ${dir}`)
  for (const file of files) {
    const parsed = registryItemSchema.safeParse(JSON.parse(readFileSync(path.join(dir, file), 'utf8')))
    if (!parsed.success) {
      errors.push(`${file}: ${parsed.error.message}`)
      continue
    }
    const item = parsed.data
    if (!names.has(item.name)) errors.push(`${file}: ${item.name} is not in registry.json`)
    for (const entry of item.files ?? []) {
      if (!entry.content?.trim()) errors.push(`${file}: ${entry.path} has no content`)
      if (/from\s+['"]\.\.\//.test(entry.content ?? '')) errors.push(`${file}: ${entry.path} imports outside its item`)
    }
    for (const dependency of item.registryDependencies ?? []) {
      const target = dependency.replace(/^@safe\//, '')
      if (!dependency.startsWith('@safe/') || !names.has(target))
        errors.push(`${file}: unknown registry dependency ${dependency}`)
    }
  }
  return errors
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = checkRegistry()
  if (errors.length) {
    console.error(errors.join('\n'))
    process.exit(1)
  }
  const count = readdirSync(outputDir).filter((file) => file.endsWith('.json') && file !== 'registry.json').length
  console.log(`check-registry: ${count} items valid`)
}
