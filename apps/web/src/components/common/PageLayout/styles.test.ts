import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule, type Declaration, type Rule } from 'postcss'

const styles = readFileSync(join(__dirname, 'styles.module.css'), 'utf8')

const stylesRoot = postcss.parse(styles)

const declOf = (rule: Rule | undefined, prop: string): string | undefined =>
  rule?.nodes?.find((node): node is Declaration => node.type === 'decl' && node.prop === prop)?.value

// Index into the shared node list so rule and at-rule positions are comparable.
const sourceIndexOf = (selector: string): number =>
  stylesRoot.nodes.findIndex((node) => node.type === 'rule' && node.selector === selector)

const findRule = (selector: string): Rule | undefined => stylesRoot.nodes[sourceIndexOf(selector)] as Rule | undefined

// The topbar is absolutely positioned, so it reproduces `.main`'s sidebar offset instead of
// inheriting it. All four sidebar states resolve through `--topbar-offset`, which is what lets
// the elevated variant re-add the offset as header padding without restating each state. These
// assertions guard that indirection: a hard-coded length anywhere in the chain, or a reordered
// rule, silently misaligns the header against the page content below it.
describe('PageLayout topbar sidebar offset', () => {
  it('positions the topbar from the offset variable rather than a hard-coded length', () => {
    const topbar = findRule('.topbar')

    expect(declOf(topbar, '--topbar-offset')).toBe('230px')
    expect(declOf(topbar, 'left')).toBe('var(--topbar-offset)')
  })

  it.each([
    ['.topbarCollapsed', '52px'],
    ['.topbarNoSidebar', '0px'],
  ])('%s overrides the offset to %s', (selector, expected) => {
    expect(declOf(findRule(selector), '--topbar-offset')).toBe(expected)
  })

  it('derives the elevated header padding from the same offset variable', () => {
    const elevated = findRule('.topbarElevated')
    const header = elevated?.nodes?.find((node): node is Rule => node.type === 'rule' && node.selector === 'header')

    // `left: 0` spans the viewport, so the offset has to reappear as padding.
    expect(declOf(elevated, 'left')).toBe('0')
    expect(declOf(header, 'padding-left')).toBe('calc(var(--topbar-offset) + 1.5rem)')
  })

  it('resets the offset below md after the sidebar-state overrides so it wins on equal specificity', () => {
    const tabletIndex = stylesRoot.nodes.findIndex(
      (node) => node.type === 'atrule' && node.name === 'media' && node.params === '(max-width: 899.95px)',
    )
    const tabletBlock = stylesRoot.nodes[tabletIndex] as AtRule | undefined
    const tabletTopbar = tabletBlock?.nodes?.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.topbar',
    )

    expect(declOf(tabletTopbar, '--topbar-offset')).toBe('0px')
    // Single-class selectors all the way down, so source order is the only tie-breaker.
    expect(tabletIndex).toBeGreaterThan(sourceIndexOf('.topbarCollapsed'))
    expect(tabletIndex).toBeGreaterThan(sourceIndexOf('.topbarNoSidebar'))
  })
})

// `.mainSpace` reserves `padding-top: var(--topbar-height)` for the out-of-flow topbar, and
// `.topbarElevated` re-adds the sidebar offset as header padding on top of a `left: 0` /
// `width: 100%` box. Both only hold while the elevated variant is *out of flow*: an in-flow
// position (`sticky`, `relative`) lands it after its own reserve — one topbar-height of empty
// page above it, the tx dialog's close button buried under it, and `width: 100%` resolving
// against `.main`'s sidebar padding so the header ends up offset by the sidebar twice.
describe('PageLayout topbar elevation', () => {
  const IN_FLOW = ['static', 'relative', 'sticky']

  it('keeps the elevated topbar out of flow, like the base variant', () => {
    // The base variant positions itself through Tailwind, so read its @apply rather than a decl.
    const baseApply = findRule('.topbar')?.nodes?.find(
      (node): node is AtRule => node.type === 'atrule' && node.name === 'apply',
    )
    // `.mainSpace` wraps its reserve in an `&&` rule to outrank `.main`.
    const reserve = findRule('.mainSpace')?.nodes?.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '&&',
    )
    const elevatedPosition = declOf(findRule('.topbarElevated'), 'position')

    expect(baseApply?.params).toContain('absolute')
    expect(declOf(reserve, 'padding-top')).toBe('var(--topbar-height)')
    expect(elevatedPosition).toBe('fixed')
    expect(IN_FLOW).not.toContain(elevatedPosition)
  })

  it('returns the elevated topbar to flow below md, after the fixed rule so it wins', () => {
    const tabletIndex = stylesRoot.nodes.findIndex(
      (node) => node.type === 'atrule' && node.name === 'media' && node.params === '(max-width: 899.95px)',
    )
    const tabletElevated = (stylesRoot.nodes[tabletIndex] as AtRule | undefined)?.nodes?.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '.topbarElevated',
    )

    // Below md nothing is reserved for the topbar, so out of flow would let content jump up.
    expect(declOf(tabletElevated, 'position')).toBe('sticky')
    expect(tabletIndex).toBeGreaterThan(sourceIndexOf('.topbarElevated'))
  })
})

describe('PageLayout responsive spacing', () => {
  it('emits the tablet top-bar reset after the desktop height reserve', () => {
    const root = postcss.parse(styles)
    const mainSpace = root.nodes?.find((node): node is Rule => node.type === 'rule' && node.selector === '.mainSpace')
    const specificityRule = mainSpace?.nodes?.find(
      (node): node is Rule => node.type === 'rule' && node.selector === '&&',
    )
    const spacingNodes = specificityRule?.nodes ?? []
    const desktopReserve = spacingNodes.findIndex(
      (node) => node.type === 'decl' && node.prop === 'padding-top' && node.value === 'var(--topbar-height)',
    )
    const tabletReset = spacingNodes.findIndex(
      (node): node is AtRule =>
        node.type === 'atrule' && node.name === 'media' && node.params === '(max-width: 899.95px)',
    )
    const tabletResetRule = spacingNodes.find(
      (node): node is AtRule =>
        node.type === 'atrule' && node.name === 'media' && node.params === '(max-width: 899.95px)',
    )

    expect(mainSpace).toBeDefined()
    expect(specificityRule).toBeDefined()
    expect(desktopReserve).toBeGreaterThanOrEqual(0)
    expect(tabletReset).toBeGreaterThan(desktopReserve)
    expect(tabletReset).toBeGreaterThanOrEqual(0)
    expect(tabletResetRule?.nodes).toContainEqual(expect.objectContaining({ name: 'apply', params: 'pt-0' }))
  })
})
