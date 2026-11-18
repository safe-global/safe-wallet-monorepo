import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { generateCSSVars } from '@safe-global/theme/generators/css-vars'
import { generateUiScopedTokensCSS, generateUiTokensCSS } from '@safe-global/theme/generators/ui-css'

const UI_STYLES = join(dirname(require.resolve('@safe-global/ui/package.json')), 'src', 'styles')
const UI_COMMAND = 'yarn workspace @safe-global/theme generate:ui-tokens'
const VARS_COMMAND = 'yarn workspace @safe-global/web css-vars'

const normalise = (css: string): string => css.toLowerCase().replace(/"/g, "'").replace(/\s+/g, ' ').trim()

const syncStatus = (file: string, inSync: boolean, command: string): string =>
  inSync ? 'in sync' : `${file} is stale: run \`${command}\` and commit the result`

describe('CSS generated from @safe-global/theme', () => {
  it.each([
    ['tokens.css', generateUiTokensCSS],
    ['tokens.scoped.css', generateUiScopedTokensCSS],
  ])('packages/ui/src/styles/%s matches the theme', (file, generate) => {
    const committed = readFileSync(join(UI_STYLES, file), 'utf8')

    expect(syncStatus(file, committed === generate(), UI_COMMAND)).toBe('in sync')
  })

  it('apps/web/src/styles/vars.css matches the theme', () => {
    const committed = readFileSync(join(__dirname, 'vars.css'), 'utf8')

    expect(syncStatus('vars.css', normalise(committed) === normalise(generateCSSVars()), VARS_COMMAND)).toBe('in sync')
  })
})
