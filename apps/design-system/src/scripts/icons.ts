import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import type { IconList } from '../lib/types.ts'
import { componentFile, componentNames, generatedDir, uiDir } from './paths.ts'

export const lucideImports = (file: string): string[] => {
  const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  const names: string[] = []
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    if (statement.moduleSpecifier.text !== 'lucide-react') continue
    const named = statement.importClause?.namedBindings
    if (named && ts.isNamedImports(named)) {
      for (const element of named.elements)
        if (!element.isTypeOnly) names.push((element.propertyName ?? element.name).text)
    }
  }
  return names
}

export const generateIcons = (root: string = uiDir): IconList => {
  const byIcon = new Map<string, Set<string>>()
  for (const component of componentNames(root)) {
    for (const icon of lucideImports(componentFile(component, root))) {
      byIcon.set(icon, (byIcon.get(icon) ?? new Set()).add(component))
    }
  }
  return [...byIcon.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, components]) => ({ name, components: [...components].sort() }))
}

export const main = (): void => {
  const icons = generateIcons()
  mkdirSync(generatedDir, { recursive: true })
  writeFileSync(path.join(generatedDir, 'icons.json'), `${JSON.stringify(icons, null, 2)}\n`)
  console.log(`icons: ${icons.length} lucide icons`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
