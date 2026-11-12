import { readdirSync, readFileSync } from 'fs'
import path from 'path'

const srcDir = __dirname

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(file)
    return /\.tsx?$/.test(entry.name) ? [file] : []
  })

const IMPORT_SPECIFIER = /(?:from\s+|import\s*\(\s*|import\s+|require\(\s*|jest\.mock\(\s*)['"](\.{1,2}\/[^'"]*)['"]/g

const relativeImports = sourceFiles(srcDir).flatMap((file) =>
  Array.from(readFileSync(file, 'utf8').matchAll(IMPORT_SPECIFIER), (match) => ({
    file: path.relative(srcDir, file),
    specifier: match[1],
    resolved: path.resolve(path.dirname(file), match[1]),
  })),
)

/** `{ layer, folder }` for a path inside `src/primitives/<folder>/` or `src/components/<folder>/` */
const layerFolder = (absolute: string): { layer: string; folder: string } | undefined => {
  const [layer, folder, ...rest] = path.relative(srcDir, absolute).split(path.sep)
  return (layer === 'primitives' || layer === 'components') && rest.length > 0 ? { layer, folder } : undefined
}

describe('relative imports', () => {
  it('finds the package imports', () => {
    expect(relativeImports.length).toBeGreaterThan(50)
  })

  it('stay inside packages/ui/src', () => {
    const escaping = relativeImports.filter(({ resolved }) => !resolved.startsWith(srcDir + path.sep))
    expect(escaping).toEqual([])
  })

  it('never reach a Safe component from a primitive', () => {
    const upward = relativeImports.filter(
      ({ file, resolved }) => file.startsWith(`primitives${path.sep}`) && layerFolder(resolved)?.layer === 'components',
    )
    expect(upward).toEqual([])
  })

  it('never import one Safe component from another', () => {
    const sideways = relativeImports.filter(({ file, resolved }) => {
      const from = layerFolder(path.join(srcDir, file))
      const to = layerFolder(resolved)
      return from?.layer === 'components' && to?.layer === 'components' && from.folder !== to.folder
    })
    expect(sideways).toEqual([])
  })
})
