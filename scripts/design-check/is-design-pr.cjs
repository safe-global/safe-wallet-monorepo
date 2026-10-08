/** Exits 0 when the pull request comes from the design team or carries the `design` label. */
const team = require('../../.github/design-team.json')

const labels = JSON.parse(process.env.LABELS || '[]')
const isDesignPr = team.members.includes(process.env.AUTHOR) || labels.includes('design')
process.exit(isDesignPr ? 0 : 1)
