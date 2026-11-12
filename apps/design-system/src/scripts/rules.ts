import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { designSystemSyntaxRules } from '@safe-global/ui/eslint'
import type { RuleDoc } from '../lib/types.ts'
import { componentFile, componentNames, generatedDir, uiDir } from './paths.ts'
import { exportedNames } from './props.ts'

export interface SyntaxRule {
  selector: string
  message: string
}

const DEFAULT_ESCAPE_HATCH = '// eslint-disable-next-line no-restricted-syntax -- <reason>'

const SAMPLE_VALUES: Record<string, string> = {
  'h-': 'h-9',
  'p-': 'p-4',
  'px-': 'px-4',
  'py-': 'py-2',
  'pt-': 'pt-2',
  'pb-': 'pb-2',
  'pl-': 'pl-2',
  'pr-': 'pr-2',
  'gap-': 'gap-2',
  'max-w-': 'max-w-md',
  'w-[': 'w-[480px]',
  'rounded-': 'rounded-lg',
  'bg-': 'bg-muted',
  border: 'border',
  'shadow-': 'shadow-sm',
  'text-[': 'text-[10px]',
}

const splitTopLevel = (text: string): string[] => {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of text) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === '|' && depth === 0) {
      parts.push(current)
      current = ''
    } else current += char
  }
  parts.push(current)
  return parts
}

/** `h-` → `h-*`, `text-(xs|sm)` → `text-xs|sm`, `w-\[` → `w-[…]` */
const displayPrefix = (alternative: string): string => {
  const unescaped = alternative.replace(/\\\\/g, '\\').replace(/\\\[/g, '[')
  if (unescaped.endsWith('[')) return `${unescaped}…]`
  const group = unescaped.match(/^(.*)\((.*)\)$/)
  if (group) return `${group[1]}${group[2]}`
  return unescaped.endsWith('-') ? `${unescaped}*` : unescaped
}

const sampleClass = (alternative: string): string => {
  const unescaped = alternative.replace(/\\\\/g, '\\').replace(/\\\[/g, '[')
  const group = unescaped.match(/^(.*)\(([^|)]*)/)
  if (group) return `${group[1]}${group[2]}`
  return SAMPLE_VALUES[unescaped] ?? `${unescaped}2`
}

export const parseRule = (rule: SyntaxRule) => {
  const element = rule.selector.match(/JSXOpeningElement\[name\.name='([\w.]+)'\]/)?.[1]
  const regex = rule.selector.match(/Literal\[value=\/\(\?:\^\|\\s\)\((.*)\)\/\]$/)?.[1]
  if (!element || !regex) throw new Error(`Cannot parse design-system rule selector: ${rule.selector}`)
  const alternatives = splitTopLevel(regex)
  const dashIndex = rule.message.indexOf('—')
  const dont = (dashIndex === -1 ? rule.message : rule.message.slice(0, dashIndex)).trim()
  const rest = dashIndex === -1 ? '' : rule.message.slice(dashIndex + 1).trim()
  const escape = rest.match(/`(\/\/ eslint-disable-next-line[^`]*)`/)?.[1] ?? DEFAULT_ESCAPE_HATCH
  const doText = rest.replace(/(The only sanctioned raw-styling escape is|Escape hatch:)\s*`[^`]*`\.?/g, '').trim()
  return {
    element,
    classPrefixes: alternatives.map(displayPrefix),
    dont,
    do: doText,
    example: `<${element} className="${alternatives.slice(0, 2).map(sampleClass).join(' ')}">`,
    escapeHatch: escape,
  }
}

export const componentByElement = (root: string = uiDir): Map<string, string> => {
  const map = new Map<string, string>()
  for (const name of componentNames(root)) {
    for (const exported of exportedNames(componentFile(name, root)).values())
      if (!map.has(exported)) map.set(exported, name)
  }
  return map
}

export const generateRules = (
  rules: SyntaxRule[] = designSystemSyntaxRules as SyntaxRule[],
  root: string = uiDir,
): RuleDoc[] => {
  const owners = componentByElement(root)
  return rules.map((rule) => {
    const parsed = parseRule(rule)
    return { ...parsed, component: owners.get(parsed.element) ?? null }
  })
}

export const main = (): void => {
  const rules = generateRules()
  mkdirSync(generatedDir, { recursive: true })
  writeFileSync(path.join(generatedDir, 'rules.json'), `${JSON.stringify(rules, null, 2)}\n`)
  console.log(`rules: ${rules.length} rules, ${rules.filter((rule) => rule.component).length} mapped to pages`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
