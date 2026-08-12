import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule, type Declaration, type Root, type Rule } from 'postcss'

const parse = (...segments: string[]): Root => postcss.parse(readFileSync(join(__dirname, ...segments), 'utf8'))

const declOf = (rule: Rule | undefined, prop: string): string | undefined =>
  rule?.nodes?.find((node): node is Declaration => node.type === 'decl' && node.prop === prop)?.value

const STYLES_ROOT = parse('styles.module.css')

/**
 * The tx dialog is a full-bleed overlay with no padding of its own, so `.container` — the row
 * holding the status rail and the content column — is what keeps the flow off the viewport edge.
 * The rail is the row's first child and the only one without padding of its own (the content
 * column carries `min-[900px]:px-10` in the JSX), so with no gutter here its step icons sit at
 * x=0, hanging off the side of the screen.
 */
describe('TxLayoutBase page gutter', () => {
  it('insets the flow row from the dialog edge', () => {
    const container = STYLES_ROOT.nodes.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.container',
    )

    // --space-3 is 24px, the same gutter the topbar's `px-6` uses, so the rail lines up with the
    // safe selector above it rather than sitting at an arbitrary offset.
    expect(declOf(container, 'padding-inline')).toBe('var(--space-3)')
  })

  it('drops the gutter below md, where the card runs edge to edge', () => {
    const mobile = STYLES_ROOT.nodes.find(
      (node): node is AtRule =>
        node.type === 'atrule' && node.name === 'media' && node.params === '(max-width: 899.95px)',
    )
    const mobileContainer = mobile?.nodes?.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.container',
    )

    expect(declOf(mobileContainer, 'padding')).toBe('0')
  })
})
