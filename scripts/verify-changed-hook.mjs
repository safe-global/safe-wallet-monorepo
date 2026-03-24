// scripts/verify-changed-hook.mjs
import { execFileSync, spawn } from 'node:child_process'

// Allow skipping via env var (e.g. SKIP_VERIFY=1 in Claude Code settings)
if (process.env.SKIP_VERIFY) {
  process.exit(0)
}

function getChangedSourceFiles() {
  try {
    const unstaged = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' })
    const staged = execFileSync('git', ['diff', '--name-only', '--cached'], { encoding: 'utf8' })
    return [...unstaged.trim().split('\n'), ...staged.trim().split('\n')]
      .filter(Boolean)
      .filter((f) => /\.[tj]sx?$/.test(f))
  } catch (err) {
    console.warn('verify-changed-hook: git diff failed:', err.message)
    return []
  }
}

function detectWorkspaces(files) {
  const hasWeb = files.some((f) => f.startsWith('apps/web/'))
  const hasMobile = files.some((f) => f.startsWith('apps/mobile/'))

  if (hasWeb && hasMobile) return ['web', 'mobile']
  if (hasMobile) return ['mobile']
  // Default to web for packages/ or other shared dirs
  return ['web']
}

const changedFiles = getChangedSourceFiles()

if (changedFiles.length === 0) {
  process.exit(0)
}

const workspaces = detectWorkspaces(changedFiles)

// Run verify for each affected workspace sequentially
let exitCode = 0

function runNext(index) {
  if (index >= workspaces.length) {
    process.exit(exitCode)
  }

  const ws = workspaces[index]
  const child = spawn('node', ['scripts/verify.mjs', '--changed', `--workspace=${ws}`, '--compact'], {
    stdio: 'inherit',
  })

  child.on('close', (code) => {
    if (code !== 0) {
      process.stderr.write(`verify:changed:${ws} failed (exit ${code})\n`)
      exitCode = code
    }
    runNext(index + 1)
  })
}

runNext(0)
