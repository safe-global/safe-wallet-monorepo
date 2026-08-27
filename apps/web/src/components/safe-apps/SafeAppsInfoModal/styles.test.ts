import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Declaration, type Rule } from 'postcss'

const stylesRoot = postcss.parse(readFileSync(join(__dirname, 'styles.module.css'), 'utf8'))

const findRule = (selector: string): Rule | undefined =>
  stylesRoot.nodes.find((node): node is Rule => node.type === 'rule' && node.selector === selector)

const declOf = (rule: Rule | undefined, prop: string): string | undefined =>
  rule?.nodes?.find((node): node is Declaration => node.type === 'decl' && node.prop === prop)?.value

describe('SafeAppsInfoModal slider overflow', () => {
  it('bounds the slide row with a minimum rather than a fixed height, so it grows with content', () => {
    const inner = findRule('.sliderInner')

    expect(declOf(inner, 'min-height')).toBe('426px')
    expect(declOf(inner, 'height')).toBeUndefined()
  })

  it('scrolls the slide area vertically while still clipping the carousel horizontally', () => {
    const container = findRule('.sliderContainer')

    expect(declOf(container, 'overflow-y')).toBe('auto')
    expect(declOf(container, 'overflow-x')).toBe('hidden')
    expect(declOf(container, 'overflow')).toBeUndefined()
  })

  it('lets the slide area shrink inside the card so the viewport cap reaches it', () => {
    const container = findRule('.sliderContainer')

    // A flex item will not shrink below its content without `min-height: 0`.
    expect(declOf(container, 'min-height')).toBe('0')
    expect(declOf(container, 'flex')).toBe('1 1 auto')
    expect(declOf(container, 'height')).toBeUndefined()
  })
})
