import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { componentNames, contentDir } from './paths.ts'

export const componentsContentDir = path.join(contentDir, 'components')

export const SECTIONS = ['Installation', 'Usage', 'Examples', 'Props', 'Accessibility', "Do / Don't"] as const

export const titleOf = (name: string): string =>
  name
    .split('-')
    .map((part) => (part === 'otp' ? 'OTP' : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ')

export const pageTemplate = (name: string): string => `---
title: ${titleOf(name)}
description: TODO one sentence on what ${titleOf(name)} is for.
component: ${name}
---

<ComponentPreview component="${name}" />

## Installation

<ComponentInstall component="${name}" />

## Usage

<ComponentUsage component="${name}" />

TODO usage notes.

## Examples

<ComponentExamples component="${name}" />

## Props

<ComponentProps component="${name}" />

## Accessibility

<BaseUiReference component="${name}" />

TODO keyboard and ARIA notes.

## Do / Don't

<ComponentRules component="${name}" />
`

export const metaJson = (names: string[]): string =>
  `${JSON.stringify({ title: 'Components', pages: ['index', ...[...names].sort()] }, null, 2)}\n`

export const main = (): void => {
  mkdirSync(componentsContentDir, { recursive: true })
  const names = componentNames()
  const created: string[] = []
  for (const name of names) {
    const file = path.join(componentsContentDir, `${name}.mdx`)
    if (existsSync(file)) continue
    writeFileSync(file, pageTemplate(name))
    created.push(name)
  }
  writeFileSync(path.join(componentsContentDir, 'meta.json'), metaJson(names))
  console.log(created.length ? `scaffold: created ${created.join(', ')}` : 'scaffold: every component has a page')
}

if (import.meta.url === `file://${process.argv[1]}`) main()
