import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { designSystemSyntaxRules } from '@safe-global/ui/eslint'
import { generateRules, parseRule, type SyntaxRule } from './rules.ts'

describe('rules', () => {
  it('parses every selector', () => {
    for (const rule of designSystemSyntaxRules as SyntaxRule[]) {
      const parsed = parseRule(rule)
      assert.ok(parsed.classPrefixes.length > 0, rule.selector)
      assert.ok(parsed.dont.startsWith("Don't") || parsed.dont.length > 0)
    }
  })

  it('throws on a selector in an unknown shape', () => {
    assert.throws(() => parseRule({ selector: 'JSXAttribute[name.name="x"]', message: 'x' }))
  })

  it('maps the design-system rules to component pages', () => {
    const pages = new Set(generateRules().map((rule) => rule.component))
    for (const page of ['button', 'card', 'input', 'tabs', 'badge', 'chip', 'dialog', 'select', 'sheet', 'drawer']) {
      assert.ok(pages.has(page), page)
    }
  })

  it('builds the Button example and splits Do from Don’t', () => {
    const button = generateRules().find((rule) => rule.element === 'Button')!
    assert.equal(button.example, '<Button className="h-9 px-4">')
    assert.match(button.do, /size/)
    assert.doesNotMatch(button.do, /eslint-disable/)
  })
})
