/**
 * Verifies that the feature-flag editor UI is dead-code-eliminated from a
 * production build. The editor is only reachable via a guarded dynamic
 * import in `apps/web/src/pages/feature-flags.tsx`, so it should never end
 * up in an emitted production chunk.
 *
 * This test runs a full `next build`, which is slow and memory-hungry, so it
 * is skipped in the default unit run. Run it explicitly with:
 *
 *   RUN_BUNDLE_TESTS=true yarn workspace @safe-global/web test src/features/feature-flags/__tests__/bundleExclusion.test.ts
 */
import { execSync } from 'child_process'
import { existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'

// Dev-only banner copy from FeatureFlagEditor.tsx — distinctive and unlikely
// to appear anywhere else in the bundle.
const MARKER = 'local feature-flag overrides'
const WEB_ROOT = path.resolve(__dirname, '../../../..')
const CHUNKS_DIR = path.join(WEB_ROOT, '.next', 'static', 'chunks')

const readAllChunks = (dir: string): string => {
  const walk = (d: string): Array<string> =>
    readdirSync(d, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) return walk(full)
      return entry.name.endsWith('.js') ? [readFileSync(full, 'utf8')] : []
    })
  return walk(dir).join('\n')
}

;(process.env.RUN_BUNDLE_TESTS === 'true' ? describe : describe.skip)(
  'feature-flag editor production exclusion',
  () => {
    jest.setTimeout(600_000)

    it('does not ship the editor marker in a production build', () => {
      execSync('yarn workspace @safe-global/web build', {
        cwd: path.resolve(WEB_ROOT, '../..'),
        env: { ...process.env, NEXT_PUBLIC_IS_PRODUCTION: 'true' },
        stdio: 'inherit',
      })
      expect(existsSync(CHUNKS_DIR)).toBe(true)
      expect(readAllChunks(CHUNKS_DIR)).not.toContain(MARKER)
    })
  },
)
