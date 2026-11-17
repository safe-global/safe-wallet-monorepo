import { readFileSync } from 'fs'
import { join } from 'path'

const css = readFileSync(join(__dirname, 'shadcn.css'), 'utf8')

describe('scoped preflight', () => {
  it('hides [hidden] elements inside .shadcn-scope despite its display resets', () => {
    const selector = ".shadcn-scope [hidden]:where(:not([hidden='until-found']))"
    const start = css.indexOf(selector)
    expect(start).toBeGreaterThan(-1)

    const body = css.slice(css.indexOf('{', start), css.indexOf('}', start))
    expect(body).toMatch(/display:\s*none\s*!important/)
  })
})
