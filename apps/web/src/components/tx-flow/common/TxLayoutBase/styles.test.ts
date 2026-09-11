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
 * column carries `min-[900px]:pl-4` in the JSX), so with no gutter here its step icons sit at
 * x=0, hanging off the side of the screen. The right gutter is deliberately not this file's:
 * TxModalDialog reserves the column its sticky close button lives in, and any right padding
 * added here stacks on top of that and pushes the Safe Shield widget away from the X.
 */
describe('TxLayoutBase page gutter', () => {
  it('insets the flow row from the dialog edge', () => {
    const container = STYLES_ROOT.nodes.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.container',
    )

    // --space-3 is 24px, the same gutter the topbar's `px-6` uses, so the rail lines up with the
    // safe selector above it rather than sitting at an arbitrary offset.
    expect(declOf(container, 'padding-left')).toBe('var(--space-3)')
  })

  it('leaves the right gutter to the dialog', () => {
    const container = STYLES_ROOT.nodes.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.container',
    )

    expect(declOf(container, 'padding-inline')).toBeUndefined()
    expect(declOf(container, 'padding-right')).toBeUndefined()
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

describe('TxLayoutBase back button row', () => {
  it('should, at every width, keep the back button bottom-left of the step', () => {
    const backButton = STYLES_ROOT.nodes.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.backButton',
    )

    expect(declOf(backButton, 'position')).toBe('absolute')
    expect(declOf(backButton, 'left')).toBe('var(--space-3)')
    expect(declOf(backButton, 'bottom')).toBe('var(--space-3)')

    const mediaOverrides = STYLES_ROOT.nodes
      .filter((node): node is AtRule => node.type === 'atrule' && node.name === 'media')
      .flatMap((media) => media.nodes ?? [])
      .filter((node): node is Rule => node.type === 'rule' && node.selector === '.backButton')

    expect(mediaOverrides).toHaveLength(0)
  })

  it('should, at every width, leave no extra row under the actions for the back button', () => {
    const actionsRules = STYLES_ROOT.nodes
      .flatMap((node) => (node.type === 'atrule' ? (node.nodes ?? []) : [node]))
      .filter((node): node is Rule => node.type === 'rule' && node.selector === '.step :global(.txCardActions)')

    expect(actionsRules).toHaveLength(1)
    expect(declOf(actionsRules[0], 'margin-bottom')).toBeUndefined()
  })
})
