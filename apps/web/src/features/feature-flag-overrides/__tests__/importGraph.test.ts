import { readdirSync, readFileSync } from 'fs'
import path from 'path'

// The Safe sidebar is statically imported on every route. If any file in it can reach the
// editor's module graph, the whole dev-only editor UI ships in the production bundle. This is the
// guard for that, and it covers the entire sidebar tree, not just the entry component.
const SIDEBAR_DIR = path.resolve(__dirname, '../../spaces/components/Sidebar')
const USE_CHAINS = path.resolve(__dirname, '../../../hooks/useChains.ts')

const ALLOWED_SPECIFIERS = [
  '@/features/feature-flag-overrides/FeatureFlagEditorDialogLoader',
  '@/features/feature-flag-overrides/store/featureFlagOverridesSlice',
]

const collectSourceFiles = (dir: string): Array<string> =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : collectSourceFiles(full)
    if (entry.name.endsWith('.stories.tsx')) return []
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })

const readSpecifiers = (file: string): Array<string> =>
  [...readFileSync(file, 'utf8').matchAll(/from\s+'([^']+)'/g)].map(([, specifier]) => specifier)

// Specifier matching only covers `from '…'`, so it misses relative paths, dynamic import(),
// require() and double quotes. Every route to the editor has to name it, so also scan for the
// identifier itself: `FeatureFlagEditorDialogLoader` is the only legal spelling anywhere.
const readEditorMentions = (file: string): Array<string> =>
  readFileSync(file, 'utf8').match(/FeatureFlagEditor[A-Za-z]*/g) ?? []

describe('feature-flag editor static import graph', () => {
  it('reaches the feature only via the store and the guarded dialog loader', () => {
    const specifiers = collectSourceFiles(SIDEBAR_DIR).flatMap(readSpecifiers)

    // Guards against a vacuous pass: a moved or renamed tree would yield no specifiers at all.
    expect(specifiers.length).toBeGreaterThan(0)

    const featureFlagSpecifiers = [...new Set(specifiers.filter((s) => s.includes('features/feature-flag-overrides')))]

    expect(featureFlagSpecifiers.sort()).toEqual(ALLOWED_SPECIFIERS)
  })

  it('never names the editor other than through the guarded loader', () => {
    const mentions = collectSourceFiles(SIDEBAR_DIR).flatMap(readEditorMentions)

    // Guards against a vacuous pass: the loader import must be visible to this scan.
    expect(mentions).toContain('FeatureFlagEditorDialogLoader')

    expect([...new Set(mentions)]).toEqual(['FeatureFlagEditorDialogLoader'])
  })
})

// `useChains` is on the static import path of ~300 files including the sidebar, so it may only
// reach the override hooks: anything else it names from this feature ships on every route.
describe('feature-flag overrides from useChains', () => {
  it('imports nothing but the override hooks', () => {
    const specifiers = readSpecifiers(USE_CHAINS).filter((s) => s.includes('features/feature-flag-overrides'))
    expect(specifiers).toEqual(['@/features/feature-flag-overrides/hooks/useChainOverrides'])
  })
})
