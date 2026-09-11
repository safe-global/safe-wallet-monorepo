import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Declaration, type Root, type Rule } from 'postcss'

const parse = (...segments: string[]): Root => postcss.parse(readFileSync(join(__dirname, ...segments), 'utf8'))

const declOf = (rule: Rule | undefined, prop: string): string | undefined =>
  rule?.nodes?.find((node): node is Declaration => node.type === 'decl' && node.prop === prop)?.value

const ruleIn = (root: Root, selector: string): Rule | undefined =>
  root.nodes.find((node): node is Rule => node.type === 'rule' && node.selector === selector)

const STATUS_ROOT = parse('styles.module.css')
const DIALOG_ROOT = parse('..', '..', '..', 'common', 'TxModalDialog', 'styles.module.css')

/**
 * `.status::before` draws one absolutely-positioned line down the whole step list, and each
 * `.itemIcon` masks the segment behind it with an opaque background so the line reads as gaps
 * between the steps rather than a stripe through them. That only works while the mask is the
 * exact colour of the surface underneath. The widget is rendered from TxLayoutBase alone, which
 * only ever mounts inside TxModalDialog, so that surface is the dialog's — and when the dialog
 * was a white sheet the mask was set to match it, then showed up as a white block behind every
 * step once the dialog went back to the page colour.
 */
describe('TxStatusWidget connector mask', () => {
  it('masks the connector with the tx dialog surface in light mode', () => {
    const dialogSurface = declOf(ruleIn(DIALOG_ROOT, '.dialog'), 'background-color')

    expect(dialogSurface).toBeDefined()
    expect(declOf(ruleIn(STATUS_ROOT, '.itemIcon'), 'background-color')).toBe(dialogSurface)
  })

  it('masks the connector with the tx dialog surface in dark mode', () => {
    const dialogSurfaceDark = declOf(ruleIn(DIALOG_ROOT, "[data-theme='dark'] .dialog"), 'background-color')

    expect(dialogSurfaceDark).toBeDefined()
    expect(declOf(ruleIn(STATUS_ROOT, "[data-theme='dark'] .itemIcon"), 'background-color')).toBe(dialogSurfaceDark)
  })

  it('keeps the icon above the connector line it masks', () => {
    const itemIcon = ruleIn(STATUS_ROOT, '.itemIcon')

    // Without the stacking context the line paints over the icon and the mask is pointless.
    expect(declOf(itemIcon, 'position')).toBe('relative')
    expect(Number(declOf(itemIcon, 'z-index'))).toBeGreaterThan(0)
  })
})
