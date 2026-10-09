/** Prints "enforce" (the author opted in), "report" (design team, never blocks) or "skip" for the Design scope workflow. */
const team = require('../../.github/design-team.json')

const labels = JSON.parse(process.env.LABELS || '[]')
const body = process.env.BODY || ''
const optedIn = labels.includes('design-only') || /^\s*[-*] \[[xX]\] Design-only\b/m.test(body)

console.log(optedIn ? 'enforce' : team.members.includes(process.env.AUTHOR) ? 'report' : 'skip')
