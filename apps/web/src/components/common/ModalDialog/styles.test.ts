import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Rule } from 'postcss'

const MODULES = {
  ModalDialog: join(__dirname, 'styles.module.css'),
  TxModalDialog: join(__dirname, '..', 'TxModalDialog', 'styles.module.css'),
}

const selectorsOf = (path: string): string[] => {
  const rules: string[] = []
  postcss.parse(readFileSync(path, 'utf8')).walkRules((rule: Rule) => {
    rules.push(rule.selector)
  })
  return rules
}

describe('dialog style modules', () => {
  // Both dialogs render Base UI popups now, so a rule keyed on a MUI class can never match. Such a
  // rule silently does nothing, which is how the footer divider went missing without anyone noticing.
  it.each(Object.entries(MODULES))('%s targets no MUI classes', (_name, path) => {
    expect(selectorsOf(path).filter((selector) => selector.includes('Mui'))).toEqual([])
  })

  it('contains TxModalDialog overscroll to the popup, which is the scroll container', () => {
    const root = postcss.parse(readFileSync(MODULES.TxModalDialog, 'utf8'))
    const dialog = root.nodes?.find((node): node is Rule => node.type === 'rule' && node.selector === '.dialog')

    expect(dialog?.nodes).toContainEqual(expect.objectContaining({ prop: 'overflow-y', value: 'auto' }))
    expect(dialog?.nodes).toContainEqual(expect.objectContaining({ prop: 'overscroll-behavior', value: 'none' }))
  })
})
