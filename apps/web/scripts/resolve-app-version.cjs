const { execFileSync } = require('node:child_process')

const TAG_PREFIX = 'web-v'
const FALLBACK_VERSION = '0.0.0'

// Release builds inject NEXT_PUBLIC_APP_VERSION from the GitHub release tag; local
// builds use the latest release tag reachable from HEAD.
function resolveAppVersion() {
  if (process.env.NEXT_PUBLIC_APP_VERSION) return process.env.NEXT_PUBLIC_APP_VERSION
  try {
    const tag = execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', `${TAG_PREFIX}*`], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    return tag.startsWith(TAG_PREFIX) ? tag.slice(TAG_PREFIX.length) : FALLBACK_VERSION
  } catch {
    return FALLBACK_VERSION
  }
}

module.exports = { resolveAppVersion }
