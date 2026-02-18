/**
 * Component Scanner
 *
 * Scans the codebase using TypeScript AST to find React components.
 * Extracts component names, file paths, and dependency information.
 *
 * Key function: scanComponents(options) → ComponentEntry[]
 *
 * Used by: generate-storybook-coverage.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'
import * as ts from 'typescript'
import type { ComponentEntry, ComponentCategory, ScannerOptions, ComponentDependencies } from './types'
import { DEFAULT_EXCLUDE_PATTERNS } from './types'

// ============================================================================
// Lookup Tables and Constants
// ============================================================================

/** Package patterns that indicate specific dependency types */
const PACKAGE_DETECTORS: Record<string, (path: string) => boolean> = {
  needsRedux: (p) => p.includes('react-redux') || p.includes('@reduxjs'),
  needsWeb3: (p) => p.includes('ethers') || p.includes('web3') || p.includes('wagmi'),
  needsMsw: (p) => p.includes('swr') || p.includes('react-query'),
}

/** Patterns in source code that indicate API calls */
const API_PATTERNS = ['useSWR', 'useQuery', 'fetch(', 'axios'] as const

/** Category path patterns for component classification */
const CATEGORY_PATTERNS: [string, ComponentCategory][] = [
  ['/ui/', 'ui'],
  ['/sidebar/', 'sidebar'],
  ['/common/', 'common'],
  ['/dashboard/', 'dashboard'],
  ['/transactions/', 'transaction'],
  ['/tx/', 'transaction'],
  ['/balances/', 'balance'],
  ['/assets/', 'balance'],
  ['/settings/', 'settings'],
  ['/layout/', 'layout'],
  ['/pages/', 'page'],
  ['/features/', 'feature'],
]

/**
 * Scans the codebase for React components
 */
export async function scanComponents(options: ScannerOptions = {}): Promise<ComponentEntry[]> {
  // Determine the correct root directory based on cwd
  const cwd = process.cwd()
  const defaultRootDir = cwd.endsWith('apps/web') ? 'src' : 'apps/web/src'
  const { rootDir = defaultRootDir, excludePatterns = DEFAULT_EXCLUDE_PATTERNS, verbose = false } = options

  const componentFiles = (
    await glob('**/*.tsx', {
      cwd: rootDir,
      ignore: excludePatterns,
      absolute: false,
    })
  ).sort()

  if (verbose) {
    console.log(`Found ${componentFiles.length} potential component files`)
  }

  const components: ComponentEntry[] = []

  for (const file of componentFiles) {
    const fullPath = path.join(rootDir, file)
    const componentInfo = await analyzeComponentFile(fullPath, file)

    if (componentInfo) {
      components.push(componentInfo)
    }
  }

  if (verbose) {
    console.log(`Identified ${components.length} components`)
  }

  return components
}

/**
 * Analyzes a single file to extract component information
 */
async function analyzeComponentFile(fullPath: string, relativePath: string): Promise<ComponentEntry | null> {
  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    const sourceFile = ts.createSourceFile(fullPath, content, ts.ScriptTarget.Latest, true)

    const componentName = extractComponentName(sourceFile, relativePath)
    if (!componentName) {
      return null
    }

    const category = determineCategory(relativePath)
    const dependencies = extractDependencies(sourceFile)
    const hasStory = checkForStory(fullPath)
    const storyPath = hasStory ? getStoryPath(fullPath) : undefined

    return {
      path: relativePath,
      name: componentName,
      category,
      hasStory,
      storyPath,
      dependencies,
      priorityScore: 0, // Will be calculated later
      priorityReasons: [],
    }
  } catch {
    return null
  }
}

// ============================================================================
// Component Name Extraction
// ============================================================================

type ExportExtractor = (node: ts.Node) => string | null

/** Extract default export assignment: export default Foo */
function extractDefaultExport(node: ts.Node): string | null {
  if (!ts.isExportAssignment(node) || node.isExportEquals) return null
  return ts.isIdentifier(node.expression) ? node.expression.text : null
}

/** Extract exported function: export function Foo() {} */
function extractExportedFunction(node: ts.Node): string | null {
  if (!ts.isFunctionDeclaration(node) || !node.name) return null
  const hasExport = ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  return hasExport && isPascalCase(node.name.text) ? node.name.text : null
}

/** Extract named exports: export { Foo } */
function extractNamedExport(node: ts.Node): string | null {
  if (!ts.isExportDeclaration(node)) return null
  if (!node.exportClause || !ts.isNamedExports(node.exportClause)) return null
  const pascalExport = node.exportClause.elements.find((e) => isPascalCase(e.name.text))
  return pascalExport?.name.text ?? null
}

/** Extract exported variable: export const Foo = ... */
function extractExportedVariable(node: ts.Node): string | null {
  if (!ts.isVariableStatement(node)) return null
  const hasExport = ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  if (!hasExport) return null
  for (const decl of node.declarationList.declarations) {
    if (ts.isIdentifier(decl.name) && isPascalCase(decl.name.text)) {
      return decl.name.text
    }
  }
  return null
}

/** Ordered list of extractors to try for component name detection */
const EXPORT_EXTRACTORS: ExportExtractor[] = [
  extractDefaultExport,
  extractExportedFunction,
  extractNamedExport,
  extractExportedVariable,
]

/**
 * Extracts the component name from a source file
 */
function extractComponentName(sourceFile: ts.SourceFile, relativePath: string): string | null {
  let result: string | null = null

  ts.forEachChild(sourceFile, (node) => {
    if (result) return

    for (const extractor of EXPORT_EXTRACTORS) {
      result = extractor(node)
      if (result) break
    }
  })

  // Fallback to PascalCase filename
  const fileName = path.basename(relativePath, '.tsx')
  return result ?? (isPascalCase(fileName) ? fileName : null)
}

// ============================================================================
// Category Detection
// ============================================================================

/**
 * Determines the component category based on file path
 */
function determineCategory(relativePath: string): ComponentCategory {
  const lowerPath = relativePath.toLowerCase()

  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (lowerPath.includes(pattern)) return category
  }

  return 'other'
}

// ============================================================================
// Dependency Extraction
// ============================================================================

/** Check if a module path is an external package */
function isExternalPackage(modulePath: string): boolean {
  return !modulePath.startsWith('.') && !modulePath.startsWith('@/')
}

/** Detect package types and update dependencies flags */
function detectPackageTypes(modulePath: string, deps: ComponentDependencies): void {
  for (const [key, detector] of Object.entries(PACKAGE_DETECTORS)) {
    if (detector(modulePath)) {
      deps[key as keyof Pick<ComponentDependencies, 'needsRedux' | 'needsWeb3' | 'needsMsw'>] = true
    }
  }
}

/** Categorize an import name by its type */
function categorizeImport(name: string): 'hooks' | 'redux' | 'components' | null {
  if (name.startsWith('use')) return 'hooks'
  if (name.includes('Slice') || name.includes('selector') || name.includes('dispatch') || name.startsWith('select')) {
    return 'redux'
  }
  if (isPascalCase(name) && !name.startsWith('use')) return 'components'
  return null
}

/** Extract named imports from an import declaration */
function extractNamedImports(node: ts.ImportDeclaration, deps: ComponentDependencies): void {
  const bindings = node.importClause?.namedBindings
  if (!bindings || !ts.isNamedImports(bindings)) return

  for (const element of bindings.elements) {
    const name = element.name.text
    const category = categorizeImport(name)

    if (category === 'redux') deps.needsRedux = true
    if (category) deps[category].push(name)
  }
}

/** Check if source text contains API call patterns */
function hasApiCalls(sourceText: string): boolean {
  return API_PATTERNS.some((p) => sourceText.includes(p))
}

/** Create empty dependencies object */
function createEmptyDependencies(): ComponentDependencies {
  return {
    hooks: [],
    redux: [],
    apiCalls: [],
    components: [],
    packages: [],
    needsMsw: false,
    needsRedux: false,
    needsWeb3: false,
  }
}

/**
 * Extracts dependencies from a source file
 */
function extractDependencies(sourceFile: ts.SourceFile): ComponentDependencies {
  const deps = createEmptyDependencies()

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) return
    if (!ts.isStringLiteral(node.moduleSpecifier)) return

    const modulePath = node.moduleSpecifier.text

    if (isExternalPackage(modulePath)) {
      deps.packages.push(modulePath)
      detectPackageTypes(modulePath, deps)
    }

    extractNamedImports(node, deps)
  })

  if (hasApiCalls(sourceFile.getFullText())) {
    deps.needsMsw = true
    deps.apiCalls.push('detected')
  }

  return deps
}

/**
 * Checks if a story file exists for a component
 */
function checkForStory(componentPath: string): boolean {
  const storyPath = getStoryPath(componentPath)
  return fs.existsSync(storyPath)
}

/**
 * Gets the expected story file path for a component
 */
function getStoryPath(componentPath: string): string {
  const dir = path.dirname(componentPath)
  const baseName = path.basename(componentPath, '.tsx')
  return path.join(dir, `${baseName}.stories.tsx`)
}

/**
 * Checks if a string is PascalCase (component naming convention)
 */
function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str)
}

/**
 * Gets all unique component paths for dependency analysis
 */
export function getComponentPaths(components: ComponentEntry[]): Set<string> {
  return new Set(components.map((c) => c.path))
}
