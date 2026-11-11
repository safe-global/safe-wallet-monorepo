import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { generateTokens, stylesDir } from './tokens.ts'

const { tokens, theme, fontSans } = generateTokens()
const css = readFileSync(path.join(stylesDir(), 'tokens.css'), 'utf8')
const [rootBlock, darkBlock] = css.split(/^\.dark \{/m)
const declared = (block: string) =>
  [...block.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((m): [string, string] => [m[1], m[2].trim()])

describe('tokens', () => {
  it('lists every tokens.css declaration once, with its dark value', () => {
    const names = tokens.map((token) => token.name)
    assert.equal(new Set(names).size, names.length)
    const light = declared(rootBlock)
    const dark = new Map(declared(darkBlock))
    assert.deepEqual(new Set(names), new Set([...light.map(([name]) => name), ...dark.keys()]))
    for (const [name, value] of light) {
      const token = tokens.find((entry) => entry.name === name)!
      assert.equal(token.light, value)
      assert.equal(token.dark ?? value, dark.get(name) ?? value, name)
    }
  })

  it('groups colours, spacing and radius', () => {
    const colors = tokens.filter((token) => token.group === 'color').map((token) => token.name)
    assert.ok(colors.includes('--primary'))
    assert.ok(colors.includes('--background'))
    assert.ok(tokens.some((token) => token.group === 'spacing' && token.name === '--space-1'))
    assert.ok(tokens.some((token) => token.group === 'radius'))
  })

  it('maps tokens to utilities through @theme inline', () => {
    assert.equal(tokens.find((token) => token.name === '--primary')?.tailwind, 'bg-primary')
    assert.ok(theme.some((mapping) => mapping.name === '--radius-lg'))
    assert.match(fontSans, /DM Sans/)
  })
})
