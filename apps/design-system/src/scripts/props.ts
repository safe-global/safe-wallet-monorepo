import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import docgen from 'react-docgen-typescript'
import type { ComponentPropsDoc, CvaVariantsDoc, PropDoc, PropsDoc } from '../lib/types.ts'
import { componentFile, componentNames, generatedDir, uiDir } from './paths.ts'

const KEEP_FROM_REACT = new Set(['className', 'children', 'render', 'asChild'])

const isAllowedSource = (fileName: string, root: string): boolean =>
  `/${fileName}`.includes(`/${path.relative(path.dirname(path.dirname(root)), path.join(root, 'src'))}/`) ||
  [
    '/@base-ui/react/',
    '/class-variance-authority/',
    '/react-resizable-panels/',
    '/vaul/',
    '/input-otp/',
    '/sonner/',
  ].some((dir) => fileName.includes(dir))

const propFilter = (root: string) => (prop: docgen.PropItem) => {
  if (KEEP_FROM_REACT.has(prop.name)) return true
  const declarations = prop.declarations ?? []
  if (declarations.length === 0) return !prop.parent || isAllowedSource(prop.parent.fileName, root)
  return declarations.some((declaration) => isAllowedSource(declaration.fileName, root))
}

const cleanType = (prop: docgen.PropItem): string => {
  const { type } = prop
  if (type.name === 'enum' && Array.isArray(type.value)) {
    const values = (type.value as Array<{ value: string }>).map((item) => item.value).filter((v) => v !== 'undefined')
    return values.join(' | ')
  }
  return (type.raw ?? type.name).replace(/\s+/g, ' ')
}

const toPropDoc = (prop: docgen.PropItem): PropDoc => ({
  name: prop.name,
  type: cleanType(prop),
  required: prop.required,
  ...(prop.description ? { description: prop.description } : {}),
  ...(prop.defaultValue?.value !== undefined && prop.defaultValue?.value !== null
    ? { default: String(prop.defaultValue.value) }
    : {}),
})

const objectLiteral = (node: ts.Node | undefined): ts.ObjectLiteralExpression | undefined =>
  node && ts.isObjectLiteralExpression(node) ? node : undefined

const propertyNamed = (object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined => {
  for (const prop of object.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name.getText().replace(/['"]/g, '') === name) return prop.initializer
  }
  return undefined
}

const keyOf = (prop: ts.ObjectLiteralElementLike, sourceFile: ts.SourceFile): string =>
  (prop.name?.getText(sourceFile) ?? '').replace(/^['"]|['"]$/g, '')

/** Variant keys and values of every `cva(...)` call bound to a top-level const in a file */
export const readCvaVariants = (file: string): CvaVariantsDoc[] => {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const result: CvaVariantsDoc[] = []
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer
      if (!init || !ts.isCallExpression(init) || init.expression.getText(sourceFile) !== 'cva') continue
      const config = objectLiteral(init.arguments[1])
      if (!config || !ts.isIdentifier(declaration.name)) continue
      const variantsNode = objectLiteral(propertyNamed(config, 'variants'))
      const defaultsNode = objectLiteral(propertyNamed(config, 'defaultVariants'))
      const variants: Record<string, string[]> = {}
      for (const prop of variantsNode?.properties ?? []) {
        if (!ts.isPropertyAssignment(prop)) continue
        const values = objectLiteral(prop.initializer)
        variants[keyOf(prop, sourceFile)] = (values?.properties ?? []).map((value) => keyOf(value, sourceFile))
      }
      const defaultVariants: Record<string, string> = {}
      for (const prop of defaultsNode?.properties ?? []) {
        if (!ts.isPropertyAssignment(prop)) continue
        const value = prop.initializer
        defaultVariants[keyOf(prop, sourceFile)] = ts.isStringLiteralLike(value)
          ? value.text
          : value.getText(sourceFile)
      }
      result.push({ name: declaration.name.text, variants, defaultVariants })
    }
  }
  return result
}

export const readBaseUiParts = (file: string): string[] => {
  const text = readFileSync(file, 'utf8')
  return [...new Set([...text.matchAll(/from ['"]@base-ui\/react\/([\w-]+)['"]/g)].map((match) => match[1]))].sort()
}

/** Exported value names in source order, keyed by their local name */
export const exportedNames = (file: string): Map<string, string> => {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const names = new Map<string, string>()
  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        if (!element.isTypeOnly) names.set(element.propertyName?.text ?? element.name.text, element.name.text)
      }
    }
    const exported =
      ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!exported) continue
    if (ts.isFunctionDeclaration(statement) && statement.name) names.set(statement.name.text, statement.name.text)
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.set(declaration.name.text, declaration.name.text)
      }
    }
  }
  return names
}

export const generateProps = (names: string[] = componentNames(), root: string = uiDir): PropsDoc[] => {
  const parser = docgen.withCustomConfig(path.join(root, 'tsconfig.json'), {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    savePropValueAsString: true,
    propFilter: propFilter(root),
  })
  const files = names.map((name) => componentFile(name, root))
  const parsed = parser.parse(files)
  return names.map((name, index) => {
    const file = files[index]
    const exported = exportedNames(file)
    const order = [...exported.values()]
    const components: ComponentPropsDoc[] = parsed
      .filter((doc) => doc.filePath === file && exported.has(doc.displayName))
      .map((doc) => ({ ...doc, displayName: exported.get(doc.displayName)! }))
      .filter((doc) => /^[A-Z]/.test(doc.displayName))
      .sort((a, b) => order.indexOf(a.displayName) - order.indexOf(b.displayName))
      .filter((doc, i, all) => all.findIndex((other) => other.displayName === doc.displayName) === i)
      .map((doc) => ({
        displayName: doc.displayName,
        ...(doc.description ? { description: doc.description } : {}),
        props: Object.values(doc.props)
          .map(toPropDoc)
          .sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name)),
      }))
    return { component: name, components, cva: readCvaVariants(file), baseUi: readBaseUiParts(file) }
  })
}

export const main = (): void => {
  const started = Date.now()
  const docs = generateProps()
  const dir = path.join(generatedDir, 'props')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  for (const doc of docs) writeFileSync(path.join(dir, `${doc.component}.json`), `${JSON.stringify(doc, null, 2)}\n`)
  console.log(`props: ${docs.length} files in ${((Date.now() - started) / 1000).toFixed(1)}s`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
