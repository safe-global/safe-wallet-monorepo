import { spawnSync } from 'child_process'
import path from 'path'

const REPO_ROOT = path.resolve(__dirname, '../../../../..')
const SCRIPT_PATH = 'packages/store/scripts/check-auto-generated-sync.ts'

describe('AUTO_GENERATED types sync', () => {
  it('AUTO_GENERATED files are in sync with schema.json', () => {
    const result = spawnSync('npx', ['tsx', SCRIPT_PATH], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    })

    const output = result.stdout + result.stderr

    if (result.status !== 0) {
      throw new Error(
        `AUTO_GENERATED files are out of sync with schema.json.\n${output}\n` +
          'Run `yarn workspace @safe-global/store build:dev` to regenerate.',
      )
    }

    expect(result.stdout).toContain('in sync')
  })
})
