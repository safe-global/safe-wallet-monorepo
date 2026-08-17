import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Declaration, type Rule } from 'postcss'

const styles = postcss.parse(readFileSync(join(__dirname, 'styles.module.css'), 'utf8'))
const globals = postcss.parse(readFileSync(join(__dirname, '../../../styles/globals.css'), 'utf8'))

const declOf = (root: postcss.Root, selector: string, prop: string): string | undefined =>
  (root.nodes.find((node): node is Rule => node.type === 'rule' && node.selector === selector)?.nodes ?? []).find(
    (node): node is Declaration => node.type === 'decl' && node.prop === prop,
  )?.value

// `Sticky` sub-headers pin at the header's measured bottom edge. A hard-coded length in either
// offset leaves a band of scrolling content showing between the two bars.
describe('PageHeader sticky offset', () => {
  it('pins the header from the shared variable rather than a hard-coded length', () => {
    expect(declOf(styles, '.container', 'top')).toBe('var(--page-header-top)')
  })

  it('derives the sub-header offset from the header offset plus its measured height', () => {
    expect(declOf(globals, ':root', '--page-header-bottom')).toBe(
      'calc(var(--page-header-top) + var(--page-header-height))',
    )
  })

  it('keeps a static height fallback for first paint, before the header is measured', () => {
    expect(declOf(globals, ':root', '--page-header-height')).toMatch(/^\d+px$/)
  })
})
