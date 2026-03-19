// scripts/verify-changed-hook.mjs
import { execFileSync, spawn } from 'node:child_process'

function hasChangedSourceFiles() {
  try {
    const unstaged = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' })
    const staged = execFileSync('git', ['diff', '--name-only', '--cached'], { encoding: 'utf8' })
    return [...unstaged.trim().split('\n'), ...staged.trim().split('\n')]
      .filter(Boolean)
      .some((f) => /\.[tj]sx?$/.test(f))
  } catch {
    return false
  }
}

if (!hasChangedSourceFiles()) {
  process.exit(0)
}

const child = spawn('node', ['scripts/verify.mjs', '--changed', '--workspace=web', '--compact'], {
  stdio: 'inherit',
})

child.on('close', (code) => {
  process.exit(code ?? 1)
})
