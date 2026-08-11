import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule, type Declaration, type Rule } from 'postcss'

const stylesRoot = postcss.parse(readFileSync(join(__dirname, 'styles.module.css'), 'utf8'))

const declOf = (rule: Rule | undefined, prop: string): string | undefined =>
  rule?.nodes?.find((node): node is Declaration => node.type === 'decl' && node.prop === prop)?.value

const dialogRulesIn = (container: { nodes?: postcss.ChildNode[] }): Rule[] =>
  (container.nodes ?? []).filter((node): node is Rule => node.type === 'rule' && node.selector === '.dialog')

const ruleIn = (root: postcss.Root, selector: string): Rule | undefined =>
  root.nodes.find((node): node is Rule => node.type === 'rule' && node.selector === selector)

const PAGE_LAYOUT_ROOT = postcss.parse(readFileSync(join(__dirname, '..', 'PageLayout', 'styles.module.css'), 'utf8'))

/**
 * The elevated topbar paints over this dialog (z-index 99 vs 3), so the dialog's top edge —
 * which carries its only close button — has to start below the topbar. The topbar's height is
 * not a constant: below the header's `@1100px` container query the safe selector wraps onto
 * its own row, and on mobile onto two. `--topbar-height` is measured from the live topbar by
 * PageLayout's ResizeObserver, so `top: var(--topbar-height)` tracks every one of those rows.
 *
 * A width-banded numeric override cannot: the one that used to live here pinned the 900–1148px
 * band to 148px, where the measured height is 152px, so the dialog's top edge — and the corner
 * its close button sits in — tucked back under the topbar. Nothing in the CSS ties such an
 * override to the measurement it is approximating, which is what this test is for.
 */
describe('TxModalDialog topbar clearance', () => {
  it('derives the dialog offset from the measured topbar height', () => {
    const [dialog] = dialogRulesIn(stylesRoot)

    expect(declOf(dialog, 'top')).toBe('var(--topbar-height)')
  })

  it('has no width-banded top offset above md to drift from that measurement', () => {
    const overrides = stylesRoot.nodes
      .filter((node): node is AtRule => node.type === 'atrule' && node.name === 'media')
      // Below md the dialog goes full-screen over the topbar, so `top: 0` there is deliberate.
      .filter((atRule) => !atRule.params.includes('max-width: 899.95px'))
      .flatMap((atRule) => dialogRulesIn(atRule))
      .map((rule) => declOf(rule, 'top'))
      .filter((top): top is string => top !== undefined)

    expect(overrides).toEqual([])
  })

  it('paints the same surface as the page it covers, in both themes', () => {
    // The dialog fills the viewport with the backdrop hidden, so any colour of its own turns the
    // flow into a visible sheet laid over the page. It read as a white panel on the grey page in
    // light mode when this was `var(--background)`, and the two tokens diverge in dark
    // (--color-background-main #121312 vs --background #000000), so both halves need pinning.
    const pageLight = declOf(ruleIn(PAGE_LAYOUT_ROOT, '.main'), 'background-color')
    const pageDark = declOf(ruleIn(PAGE_LAYOUT_ROOT, "[data-theme='dark'] .mainSpace"), 'background-color')

    expect(pageLight).toBeDefined()
    expect(pageDark).toBeDefined()
    expect(declOf(ruleIn(stylesRoot, '.dialog'), 'background-color')).toBe(pageLight)
    expect(declOf(ruleIn(stylesRoot, "[data-theme='dark'] .dialog"), 'background-color')).toBe(pageDark)
  })

  it('leaves the paper class without a background that could override that surface', () => {
    // `.dialog` and `.paper` land on the same element here (they were separate nodes under MUI),
    // so a background on the later-declared `.paper` silently wins over the pair above.
    expect(declOf(ruleIn(stylesRoot, '.paper'), 'background-color')).toBeUndefined()
  })

  it('drops the offset only where the dialog covers the topbar outright', () => {
    const mobile = stylesRoot.nodes.find(
      (node): node is AtRule =>
        node.type === 'atrule' && node.name === 'media' && node.params === '(max-width: 899.95px)',
    )
    const [mobileDialog] = dialogRulesIn(mobile ?? {})

    expect(declOf(mobileDialog, 'top')).toBe('0')
    expect(Number(declOf(mobileDialog, 'z-index'))).toBeGreaterThan(99)
  })
})
