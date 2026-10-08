/** Prints "true" when the pull request comes from the design team or carries the `design` label. */
const team = require('../../.github/design-team.json')

const labels = JSON.parse(process.env.LABELS || '[]')
console.log(team.members.includes(process.env.AUTHOR) || labels.includes('design') ? 'true' : 'false')
