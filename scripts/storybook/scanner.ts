import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'
import * as ts from 'typescript'
import type { ComponentEntry, ComponentCategory, ScannerOptions, ComponentDependencies } from './types'
import { DEFAULT_EXCLUDE_PATTERNS } from './types'

/**
 * Scans the codebase for React components
 */
export async function scanComponents(options: ScannerOptions = {}): Promise<ComponentEntry[]> {
  // Determine the correct root directory based on cwd
  const cwd = process.cwd()
  const defaultRootDir = cwd.endsWith('apps/web') ? 'src' : 'apps/web/src'
  const { rootDir = defaultRootDir, excludePatterns = DEFAULT_EXCLUDE_PATTERNS, verbose = false } = options

  const componentFiles = await glob('**/*.tsx', {
    cwd: rootDir,
    ignore: excludePatterns,
    absolute: false,
  })

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

/**
 * Extracts the component name from a source file
 */
function extractComponentName(sourceFile: ts.SourceFile, relativePath: string): string | null {
  let componentName: string | null = null

  // Look for default export or named export that matches file name
  const fileName = path.basename(relativePath, '.tsx')

  ts.forEachChild(sourceFile, (node) => {
    // Check for default export
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      if (ts.isIdentifier(node.expression)) {
        componentName = node.expression.text
      }
    }

    // Check for exported function declarations (both default and named)
    if (ts.isFunctionDeclaration(node)) {
      const modifiers = ts.getModifiers(node)
      const hasExport = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)

      if (hasExport && node.name) {
        const name = node.name.text
        // Accept PascalCase function names as components
        if (isPascalCase(name)) {
          componentName = name
        }
      }
    }

    // Check for named exports
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        const name = element.name.text
        if (isPascalCase(name)) {
          componentName = name
          break
        }
      }
    }

    // Check for exported const/function declarations
    if (ts.isVariableStatement(node)) {
      const modifiers = ts.getModifiers(node)
      const hasExport = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)

      if (hasExport) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && isPascalCase(declaration.name.text)) {
            componentName = declaration.name.text
            break
          }
        }
      }
    }
  })

  // Fallback to file name if it's PascalCase
  if (!componentName && isPascalCase(fileName)) {
    componentName = fileName
  }

  return componentName
}

/**
 * Determines the component category based on file path
 */
function determineCategory(relativePath: string): ComponentCategory {
  const lowerPath = relativePath.toLowerCase()

  if (lowerPath.includes('/ui/')) return 'ui'
  if (lowerPath.includes('/sidebar/')) return 'sidebar'
  if (lowerPath.includes('/common/')) return 'common'
  if (lowerPath.includes('/dashboard/')) return 'dashboard'
  if (lowerPath.includes('/transactions/') || lowerPath.includes('/tx/')) return 'transaction'
  if (lowerPath.includes('/balances/') || lowerPath.includes('/assets/')) return 'balance'
  if (lowerPath.includes('/settings/')) return 'settings'
  if (lowerPath.includes('/layout/')) return 'layout'
  if (lowerPath.includes('/pages/')) return 'page'
  if (lowerPath.includes('/features/')) return 'feature'

  return 'other'
}

/**
 * Extracts dependencies from a source file
 */
function extractDependencies(sourceFile: ts.SourceFile): ComponentDependencies {
  const dependencies: ComponentDependencies = {
    hooks: [],
    redux: [],
    apiCalls: [],
    components: [],
    packages: [],
    needsMsw: false,
    needsRedux: false,
    needsWeb3: false,
  }

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier
      if (ts.isStringLiteral(moduleSpecifier)) {
        const modulePath = moduleSpecifier.text

        // Check for package imports
        if (!modulePath.startsWith('.') && !modulePath.startsWith('@/')) {
          dependencies.packages.push(modulePath)

          // Check for specific packages
          if (modulePath.includes('react-redux') || modulePath.includes('@reduxjs')) {
            dependencies.needsRedux = true
          }
          if (modulePath.includes('ethers') || modulePath.includes('web3') || modulePath.includes('wagmi')) {
            dependencies.needsWeb3 = true
          }
          if (modulePath.includes('swr') || modulePath.includes('react-query')) {
            dependencies.needsMsw = true
          }
        }

        // Extract named imports
        if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          for (const element of node.importClause.namedBindings.elements) {
            const importName = element.name.text

            // Detect hooks
            if (importName.startsWith('use')) {
              dependencies.hooks.push(importName)
            }

            // Detect Redux imports
            if (
              importName.includes('Slice') ||
              importName.includes('selector') ||
              importName.includes('dispatch') ||
              importName.startsWith('select')
            ) {
              dependencies.redux.push(importName)
              dependencies.needsRedux = true
            }

            // Detect component imports
            if (isPascalCase(importName) && !importName.startsWith('use')) {
              dependencies.components.push(importName)
            }
          }
        }
      }
    }
  })

  // Check for API call patterns in source
  const sourceText = sourceFile.getFullText()
  if (
    sourceText.includes('useSWR') ||
    sourceText.includes('useQuery') ||
    sourceText.includes('fetch(') ||
    sourceText.includes('axios')
  ) {
    dependencies.needsMsw = true
    dependencies.apiCalls.push('detected')
  }

  return dependencies
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
