import { getFiatChangeColor, getFiatChangeSign } from './fiatChange'

describe('getFiatChangeColor', () => {
  it('maps direction to a theme colour token', () => {
    expect(getFiatChangeColor('up')).toBe('$success')
    expect(getFiatChangeColor('down')).toBe('$error')
    expect(getFiatChangeColor('none')).toBe('$colorSecondary')
  })
})

describe('getFiatChangeSign', () => {
  it('maps direction to a sign prefix', () => {
    expect(getFiatChangeSign('up')).toBe('+')
    expect(getFiatChangeSign('down')).toBe('-')
    expect(getFiatChangeSign('none')).toBe('')
  })
})
