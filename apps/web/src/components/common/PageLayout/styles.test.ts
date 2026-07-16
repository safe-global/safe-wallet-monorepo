import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type AtRule, type Rule } from 'postcss'

const styles = readFileSync(join(__dirname, 'styles.module.css'), 'utf8')

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
