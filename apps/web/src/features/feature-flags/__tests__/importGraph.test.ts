import { readFileSync } from 'fs'
import path from 'path'

// `SafeSidebarContent` is statically imported on every route. If it can reach the editor's
// module graph, the whole dev-only editor UI ships in the production bundle. `bundleExclusion`
// proves this properly but only runs under RUN_BUNDLE_TESTS; this is the always-on guard.
const SIDEBAR_CONTENT = path.resolve(
  __dirname,
  '../../spaces/components/Sidebar/variants/SafeSidebarContent/SafeSidebarContent.tsx',
)

describe('feature-flag editor static import graph', () => {
  it('reaches the feature only via the store and the guarded dialog loader', () => {
    const source = readFileSync(SIDEBAR_CONTENT, 'utf8')
    const specifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map(([, specifier]) => specifier)

    // Guards against a vacuous pass: a moved or renamed file would yield no specifiers at all.
    expect(specifiers.length).toBeGreaterThan(0)

    expect(specifiers.filter((s) => s.includes('features/feature-flags')).sort()).toEqual([
      '@/features/feature-flags/FeatureFlagEditorDialogLoader',
      '@/features/feature-flags/store',
    ])
  })
})
