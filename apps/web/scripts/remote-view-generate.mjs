// Generates the remote view wiring from packages/views:
// - src/remote-view/generated/registry.ts: every sandboxed view, for the worker
// - src/remote-view/generated/host/**: a page-side wrapper per sandboxed view module (same exports, renders RemoteView)
// - src/remote-view/generated/modules.json: sandboxed module file -> wrapper file, for the bundler swap
// Every view module is sandboxed unless src/remote-view/kept.json lists it with a reason.
import { build } from 'esbuild'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const web = path.join(root, '..')
const viewsSrc = path.join(web, '../../packages/views/src')
const outDir = path.join(web, 'src/remote-view/generated')
const kept = JSON.parse(readFileSync(path.join(web, 'src/remote-view/kept.json'), 'utf8'))

const SKIP = /(\.stories|\.test|\.spec)\.tsx?$|__tests__|__mocks__|\/mocks?\/|fixtures?/
const COMPONENT = /^[A-Z][A-Za-z0-9]*$/
const CONSTANT = /^[A-Z0-9_]+$/

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name)
    return statSync(file).isDirectory() ? walk(file) : [file]
  })

const candidates = ['components', 'features']
  .flatMap((dir) => walk(path.join(viewsSrc, dir)))
  .filter((file) => file.endsWith('.tsx') && !file.includes(`${path.sep}components${path.sep}ui${path.sep}`))
  .filter((file) => !SKIP.test(file))

const exportsOf = async (files) => {
  const result = await build({
    entryPoints: files,
    bundle: false,
    write: false,
    metafile: true,
    outdir: '/remote-view-exports',
    outbase: viewsSrc,
    format: 'esm',
    jsx: 'automatic',
    logLevel: 'error',
  })
  const exports = new Map()
  for (const output of Object.values(result.metafile.outputs)) {
    if (output.entryPoint) exports.set(path.resolve(output.entryPoint), output.exports)
  }
  return exports
}

const isComponent = (name) => name === 'default' || (COMPONENT.test(name) && !CONSTANT.test(name))

// CSS modules a view loads, directly or through package files it imports.
const IMPORT = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g
const resolveImport = (from, specifier) => {
  const base = specifier.startsWith('@safe-global/views/')
    ? path.join(viewsSrc, specifier.slice('@safe-global/views/'.length))
    : specifier.startsWith('.')
      ? path.resolve(path.dirname(from), specifier)
      : null
  if (!base) return null
  for (const candidate of [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

const cssModulesOf = (file, seen = new Set()) => {
  if (seen.has(file)) return []
  seen.add(file)
  if (file.endsWith('.module.css')) return [file]
  if (!/\.tsx?$/.test(file)) return []
  const source = readFileSync(file, 'utf8')
  return [...source.matchAll(IMPORT)].flatMap(([, specifier]) => {
    const resolved = resolveImport(file, specifier)
    return resolved ? cssModulesOf(resolved, seen) : []
  })
}

// `export { a, b } from './helpers'`: values a view module re-exports from a non-view file. The wrapper re-exports
// them from that file, so the page gets the values without loading the view.
const REEXPORT = /export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
const reexportsOf = (file) => {
  const source = readFileSync(file, 'utf8')
  const found = new Map()
  for (const [statement, names, specifier] of source.matchAll(REEXPORT)) {
    if (/export\s+type\s*\{/.test(statement)) continue
    const target = resolveImport(file, specifier)
    if (!target) continue
    for (const name of names
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part && !part.startsWith('type '))) {
      const exported = name.split(/\s+as\s+/).pop()
      found.set(exported, { statement: name, target })
    }
  }
  return found
}

// Capitalised exports that are data, not components (enums, constant objects, strings, numbers).
const isValueDeclaration = (file, name) =>
  new RegExp(`export\\s+(enum\\s+${name}\\b|const\\s+${name}\\s*(:[^=]+)?=\\s*[\\[{'"\`\\d])`).test(
    readFileSync(file, 'utf8'),
  )

const moduleId = (file) => path.relative(viewsSrc, file).split(path.sep).join('/')
const specifierOf = (file) => `@safe-global/views/${moduleId(file).replace(/\.tsx?$/, '')}`

// Worker stand-ins for the primitives the page draws (listed in src/remote-view/primitiveRegistry.ts): each module
// keeps its non-component exports and replaces every component with a remote `ui-primitive` element.
const generatePrimitives = async () => {
  const registry = readFileSync(path.join(web, 'src/remote-view/primitiveRegistry.ts'), 'utf8')
  const names = [...registry.matchAll(/from '@safe-global\/views\/components\/ui\/([a-z-]+)'/g)].map(([, name]) => name)
  const files = names.map((name) => path.join(viewsSrc, 'components/ui', `${name}.tsx`))
  const exports = await exportsOf(files)
  const standIn = path.join(web, 'src/remote-view/frame/primitive.ts')
  const out = {}
  await mkdir(path.join(outDir, 'primitives'), { recursive: true })
  for (const [index, name] of names.entries()) {
    const components = (exports.get(files[index]) ?? []).filter((item) => item !== 'default' && isComponent(item))
    const file = path.join(outDir, 'primitives', `${name}.ts`)
    await writeFile(
      file,
      [
        '// Generated by scripts/remote-view-generate.mjs. Do not edit.',
        `export * from ${JSON.stringify(files[index])}`,
        `import { hostPrimitive } from ${JSON.stringify(standIn)}`,
        ...components.map((component) => `export const ${component} = hostPrimitive('${name}#${component}')`),
        '',
      ].join('\n'),
    )
    out[name] = file
  }
  await writeFile(path.join(outDir, 'primitives.json'), JSON.stringify(out, null, 2))
}

export const generate = async () => {
  const exports = await exportsOf(candidates)
  const views = candidates.filter((file) => (exports.get(file) ?? []).some(isComponent))
  const unknownKept = Object.keys(kept).filter((id) => !views.some((file) => moduleId(file) === id))
  if (unknownKept.length) throw new Error(`kept.json lists modules that are not views: ${unknownKept.join(', ')}`)
  const sandboxed = views.filter((file) => !(moduleId(file) in kept))

  await rm(outDir, { recursive: true, force: true })
  await mkdir(path.join(outDir, 'host'), { recursive: true })
  await generatePrimitives()

  const registry = []
  const modules = {}
  const problems = []
  for (const [index, file] of sandboxed.entries()) {
    const id = moduleId(file)
    const reexports = reexportsOf(file)
    const fromNonView = (name) => reexports.has(name) && !views.includes(reexports.get(name).target)
    const values = exports
      .get(file)
      .filter((name) => !isComponent(name) || isValueDeclaration(file, name) || fromNonView(name))
    const unsupported = values.filter((name) => !fromNonView(name))
    if (unsupported.length) problems.push(`${id}: ${unsupported.join(', ')}`)
    const components = exports.get(file).filter((name) => isComponent(name) && !values.includes(name))
    const specifier = specifierOf(file)
    registry.push({ index, id, specifier, components })

    const css = [...new Set(cssModulesOf(file))]
    const wrapper = path.join(outDir, 'host', id)
    const lines = [
      '// Generated by scripts/remote-view-generate.mjs. Do not edit.',
      "import type { ComponentProps } from 'react'",
      `import type * as View from '${specifier}'`,
      "import { RemoteView } from '@/remote-view/ClientRemoteView'",
      ...(css.length ? ["import { registerCss } from '@/remote-view/css'"] : []),
      ...css.map((cssFile, i) => `import css${i} from '${specifierOf(cssFile).replace(/\.tsx$/, '')}'`),
      ...css.map((cssFile, i) => `registerCss('${moduleId(cssFile)}', css${i})`),
      '',
      ...components.map((name) => {
        const local = name === 'default' ? 'RemoteDefault' : name
        const type = name === 'default' ? 'View.default' : `View.${name}`
        return `${name === 'default' ? 'const' : 'export const'} ${local} = (props: ComponentProps<typeof ${type}>) => (\n  <RemoteView name="${id}#${name}" props={props as unknown as Record<string, unknown>} />\n)`
      }),
      ...values.map(
        (name) =>
          `export { ${reexports.get(name)?.statement ?? name} } from '${reexports.get(name) ? specifierOf(reexports.get(name).target).replace(/\.tsx?$/, '') : specifier}'`,
      ),
      ...(components.includes('default') ? ['export default RemoteDefault'] : []),
      `export type * from '${specifier}'`,
      '',
    ]
    await mkdir(path.dirname(wrapper), { recursive: true })
    await writeFile(wrapper, lines.join('\n'))
    modules[file] = wrapper
  }

  if (problems.length) {
    throw new Error(
      `Sandboxed view modules may only export components; move these values to a non-view file and re-export them:\n${problems.join('\n')}`,
    )
  }

  const registrySource = [
    '// Generated by scripts/remote-view-generate.mjs. Do not edit.',
    "import type { ComponentType } from 'react'",
    ...registry.map(({ index, specifier }) => `import * as m${index} from '${specifier}'`),
    '',
    'export const REMOTE_VIEWS: Record<string, ComponentType<never>> = {',
    ...registry.flatMap(({ index, id, components }) =>
      components.map(
        (name) =>
          `  '${id}#${name}': m${index}${name === 'default' ? '.default' : `.${name}`} as ComponentType<never>,`,
      ),
    ),
    '}',
    '',
  ].join('\n')
  await writeFile(path.join(outDir, 'registry.ts'), registrySource)
  await writeFile(path.join(outDir, 'modules.json'), JSON.stringify(modules, null, 2))
  return { sandboxed: sandboxed.length, kept: Object.keys(kept).length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { sandboxed, kept: keptCount } = await generate()
  console.log(`remote-view: ${sandboxed} view modules sandboxed, ${keptCount} kept on the page`)
}
