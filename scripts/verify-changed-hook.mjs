// scripts/verify-changed-hook.mjs
import { execFileSync, spawn } from 'node:child_process'

function getChangedSourceFiles() {
  try {
    const unstaged = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' })
    const staged = execFileSync('git', ['diff', '--name-only', '--cached'], { encoding: 'utf8' })
    return [...unstaged.trim().split('\n'), ...staged.trim().split('\n')]
      .filter(Boolean)
      .filter((f) => /\.[tj]sx?$/.test(f))
  } catch {
    return []
  }
}

function detectWorkspace(files) {
  const hasWeb = files.some((f) => f.startsWith('apps/web/'))
  const hasMobile = files.some((f) => f.startsWith('apps/mobile/'))

  // Default to web if changes are in packages/ or other shared dirs
  if (hasWeb || (!hasWeb && !hasMobile)) return 'web'
  if (hasMobile) return 'mobile'
  return 'web'
}

const changedFiles = getChangedSourceFiles()

if (changedFiles.length === 0) {
  process.exit(0)
}

const workspace = detectWorkspace(changedFiles)

const child = spawn('node', ['scripts/verify.mjs', '--changed', `--workspace=${workspace}`, '--compact'], {
  stdio: 'inherit',
})

child.on('close', (code) => {
  process.exit(code ?? 1)
})
