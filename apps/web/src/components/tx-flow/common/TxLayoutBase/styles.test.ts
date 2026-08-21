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

/**
 * The submit row's bottom margin only exists to clear the Back button, which is centred below the
 * card at this width. Reserving it on every step left a phantom gap under single-step flows, which
 * is why several of them hand-rolled their own action rows rather than reusing the shared footer.
 */
describe('TxLayoutBase submit row spacing', () => {
  it('reserves room below the submit row only on steps that render a back button', () => {
    const tablet = STYLES_ROOT.nodes.find(
      (node): node is AtRule =>
        node.type === 'atrule' && node.name === 'media' && node.params === '(max-width: 1199px)',
    )

    const scoped = tablet?.nodes?.find(
      (node): node is Rule => node.type === 'rule' && node.selector.startsWith('.stepWithBackButton'),
    )
    expect(declOf(scoped, 'margin-bottom')).toBe('var(--space-8)')

    // No unscoped `.step` rule may reintroduce it for every step.
    const unscoped = tablet?.nodes?.filter(
      (node): node is Rule =>
        node.type === 'rule' && node.selector.startsWith('.step ') && declOf(node, 'margin-bottom') !== undefined,
    )
    expect(unscoped).toHaveLength(0)
  })
})

/**
 * A 6px progress bar cannot render the card's 24px corner. When a flow has no header row the strip
 * is dropped and the bar is pinned over the card's own rounded top instead, so the radius stays
 * visible rather than collapsing into a stray line above a square-topped card.
 */
describe('TxLayoutBase header-less progress bar', () => {
  it('clips the floating bar to the same radius the card uses', () => {
    const floating = STYLES_ROOT.nodes.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.floatingProgressBar',
    )

    expect(declOf(floating, 'position')).toBe('absolute')
    expect(declOf(floating, 'overflow')).toBe('hidden')
    expect(declOf(floating, 'border-top-left-radius')).toBe('var(--radius-xl)')
    expect(declOf(floating, 'border-top-right-radius')).toBe('var(--radius-xl)')
  })

  it('keeps the first card rounded unless a header strip supplies the radius', () => {
    const underHeader = STYLES_ROOT.nodes.find(
      (node): node is Rule =>
        node.type === 'rule' && node.selector.startsWith('.stepUnderHeader > ') && node.selector.includes('txCardRoot'),
    )

    expect(declOf(underHeader, 'border-top-left-radius')).toBe('0')

    // The unscoped rule must only flush the card against what is above it, never square it off.
    const unscoped = STYLES_ROOT.nodes.find(
      (node): node is Rule =>
        node.type === 'rule' && node.selector.startsWith('.step > ') && node.selector.includes('txCardRoot'),
    )
    expect(declOf(unscoped, 'margin-top')).toBe('0')
    expect(declOf(unscoped, 'border-top-left-radius')).toBeUndefined()
  })
})
