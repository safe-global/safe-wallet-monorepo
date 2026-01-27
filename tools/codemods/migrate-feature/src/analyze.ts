/**
 * Phase 1: Analyze a feature and generate migration config
 */

import * as fs from 'fs'
import * as path from 'path'
import type { AnalysisResult, FeatureConfig, FeatureStructure, ExportInfo, Consumer, ImportInfo } from './types.js'
import { getFeaturePath, findFiles, readFile, getExportType, featureNameToFlag } from './utils.js'

/**
 * Analyze feature structure
 */
function analyzeStructure(featurePath: string): FeatureStructure {
  return {
    hasComponentsFolder: fs.existsSync(path.join(featurePath, 'components')),
    hasHooksFolder: fs.existsSync(path.join(featurePath, 'hooks')),
    hasServicesFolder: fs.existsSync(path.join(featurePath, 'services')),
    hasStoreFolder: fs.existsSync(path.join(featurePath, 'store')),
    hasUtilsFolder: fs.existsSync(path.join(featurePath, 'utils')),
    hasContextsFolder: fs.existsSync(path.join(featurePath, 'contexts')),
    hasTypesFile: fs.existsSync(path.join(featurePath, 'types.ts')),
    hasConstantsFile: fs.existsSync(path.join(featurePath, 'constants.ts')),
    hasReadme: fs.existsSync(path.join(featurePath, 'README.md')),
  }
}

/**
 * Parse exports from a TypeScript file using regex
 */
function parseExports(filePath: string): ExportInfo[] {
  const content = readFile(filePath)
  if (!content) return []

  const exports: ExportInfo[] = []

  // Match: export default Component
  const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/)
  if (defaultExportMatch) {
    const name = defaultExportMatch[1]!
    exports.push({
      name,
      type: getExportType(name),
      filePath,
      isDefault: true,
    })
  }

  // Match: export { Foo, Bar }
  const namedExportsMatches = content.matchAll(/export\s*{\s*([^}]+)\s*}/g)
  for (const match of namedExportsMatches) {
    const names = match[1]!.split(',').map((n) =>
      n
        .trim()
        .split(/\s+as\s+/)[0]!
        .trim(),
    )
    for (const name of names) {
      if (name && !name.startsWith('type ')) {
        exports.push({
          name,
          type: getExportType(name),
          filePath,
          isDefault: false,
        })
      }
    }
  }

  // Match: export const foo = ...
  const constExportMatches = content.matchAll(/export\s+const\s+(\w+)/g)
  for (const match of constExportMatches) {
    const name = match[1]!
    exports.push({
      name,
      type: getExportType(name),
      filePath,
      isDefault: false,
    })
  }

  // Match: export function foo()
  const funcExportMatches = content.matchAll(/export\s+function\s+(\w+)/g)
  for (const match of funcExportMatches) {
    const name = match[1]!
    exports.push({
      name,
      type: getExportType(name),
      filePath,
      isDefault: false,
    })
  }

  return exports
}

/**
 * Discover all exports in a feature
 */
function discoverExports(featurePath: string): ExportInfo[] {
  const tsFiles = findFiles(featurePath, /\.(ts|tsx)$/)
  const allExports: ExportInfo[] = []

  for (const file of tsFiles) {
    // Skip test files
    if (file.includes('__tests__') || file.includes('.test.') || file.includes('.stories.')) {
      continue
    }

    const exports = parseExports(file)
    allExports.push(...exports)
  }

  return allExports
}

/**
 * Parse default import from a regex match
 */
function parseDefaultImport(
  defaultImport: string,
  featurePathPattern: string,
  subPath: string | undefined,
  isTypeOnly: boolean,
): ImportInfo {
  return {
    name: defaultImport,
    type: getExportType(defaultImport),
    importPath: `${featurePathPattern}${subPath || ''}`,
    isDefault: true,
    isTypeOnly,
  }
}

/**
 * Parse named imports from a regex match
 */
function parseNamedImports(
  namedImportsString: string,
  featurePathPattern: string,
  subPath: string | undefined,
  isTypeOnly: boolean,
): ImportInfo[] {
  const names = namedImportsString
    .split(',')
    .map((n) =>
      n
        .trim()
        .split(/\s+as\s+/)[0]!
        .trim(),
    )
    .filter((n) => n.length > 0)

  return names.map((name) => {
    const cleanName = name.replace(/^type\s+/, '')
    return {
      name: cleanName,
      type: getExportType(cleanName),
      importPath: `${featurePathPattern}${subPath || ''}`,
      isDefault: false,
      isTypeOnly: isTypeOnly || name.startsWith('type '),
    }
  })
}

/**
 * Parse imports from a TypeScript file
 */
function parseImports(filePath: string, featureName: string): ImportInfo[] {
  const content = readFile(filePath)
  if (!content) return []

  const imports: ImportInfo[] = []
  const featurePathPattern = `@/features/${featureName}`

  // Match imports from the feature
  const importRegex = new RegExp(
    `import\\s+(?:type\\s+)?(?:{([^}]+)}|([\\w]+))\\s+from\\s+['"]${featurePathPattern}([^'"]*?)['"]`,
    'g',
  )

  for (const match of content.matchAll(importRegex)) {
    const isTypeOnly = match[0]!.includes('import type')
    const namedImportsString = match[1]
    const defaultImport = match[2]
    const subPath = match[3]

    if (defaultImport) {
      imports.push(parseDefaultImport(defaultImport, featurePathPattern, subPath, isTypeOnly))
    }

    if (namedImportsString) {
      imports.push(...parseNamedImports(namedImportsString, featurePathPattern, subPath, isTypeOnly))
    }
  }

  return imports
}

/**
 * Find all consumers of a feature
 */
function findConsumers(featureName: string): Consumer[] {
  const consumers: Consumer[] = []
  const srcPath = path.join(process.cwd(), 'apps', 'web', 'src')
  const allFiles = findFiles(srcPath, /\.(ts|tsx)$/)

  for (const file of allFiles) {
    // Skip the feature's own files
    if (file.includes(`/features/${featureName}/`)) {
      continue
    }

    const imports = parseImports(file, featureName)
    if (imports.length > 0) {
      consumers.push({
        filePath: file,
        imports,
      })
    }
  }

  return consumers
}

/**
 * Add unique export name to the appropriate category
 */
function addToCategoryIfUnique(categories: Record<string, string[]>, type: string, name: string): void {
  if (!categories[type]) {
    categories[type] = []
  }
  if (!categories[type]!.includes(name)) {
    categories[type]!.push(name)
  }
}

/**
 * Categorize exports into public API
 */
function categorizeExports(exports: ExportInfo[]) {
  const categories: Record<string, string[]> = {
    components: [],
    hooks: [],
    services: [],
    types: [],
    constants: [],
  }

  // Map export types to category names
  const typeToCategory: Record<string, string> = {
    component: 'components',
    hook: 'hooks',
    service: 'services',
    type: 'types',
    constant: 'constants',
  }

  for (const exp of exports) {
    const category = typeToCategory[exp.type]
    if (category) {
      addToCategoryIfUnique(categories, category, exp.name)
    }
  }

  return {
    components: categories.components!,
    hooks: categories.hooks!,
    services: categories.services!,
    types: categories.types!,
    constants: categories.constants!,
  }
}

/**
 * Main analysis function
 */
export async function analyzeFeature(featureName: string): Promise<AnalysisResult> {
  const featurePath = getFeaturePath(featureName)
  const warnings: string[] = []
  const suggestions: string[] = []

  // Analyze structure
  const structure = analyzeStructure(featurePath)

  // Discover exports
  const allExports = discoverExports(featurePath)

  // Find consumers
  const consumers = findConsumers(featureName)

  // Categorize exports
  const publicAPI = categorizeExports(allExports)

  // Determine feature flag
  let featureFlag = featureNameToFlag(featureName)

  // Check if a handle file exists with explicit flag
  const handlePath = path.join(featurePath, 'handle.ts')
  if (fs.existsSync(handlePath)) {
    const handleContent = readFile(handlePath)
    const flagMatch = handleContent?.match(/FEATURES\.(\w+)/)
    if (flagMatch) {
      featureFlag = flagMatch[1]!
    }
  }

  // Generate warnings
  if (!structure.hasComponentsFolder && publicAPI.components.length > 0) {
    warnings.push('Components are not organized in a components/ folder')
  }
  if (!structure.hasHooksFolder && publicAPI.hooks.length > 0) {
    warnings.push('Hooks are not organized in a hooks/ folder')
  }
  if (structure.hasUtilsFolder) {
    suggestions.push('Consider moving utils/ to src/utils/ if used by multiple features')
  }
  if (structure.hasContextsFolder) {
    warnings.push('Feature uses React Context - consider migrating to Redux for better feature isolation')
  }
  if (consumers.length === 0) {
    warnings.push('No consumers found - feature might be unused')
  }

  // Build config
  const config: FeatureConfig = {
    featureName,
    featureFlag,
    publicAPI,
    structure,
    consumers,
  }

  return {
    config,
    warnings,
    suggestions,
  }
}

/**
 * Save analysis result to a JSON file
 */
export function saveAnalysisConfig(config: FeatureConfig, outputPath: string): boolean {
  try {
    const json = JSON.stringify(config, null, 2)
    fs.writeFileSync(outputPath, json, 'utf-8')
    return true
  } catch {
    return false
  }
}

/**
 * Load analysis config from a JSON file
 */
export function loadAnalysisConfig(configPath: string): FeatureConfig | null {
  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(content) as FeatureConfig
  } catch {
    return null
  }
}
