/**
 * Map changed files to affected routes by analyzing import dependencies
 *
 * This script builds a dependency graph from the codebase and traces
 * which page files are affected by changed source files.
 */

const fs = require('fs')
const path = require('path')
const { SCREENSHOTTABLE_ROUTES, TEST_SAFE } = require('./page-screenshot-config.js')

const changedFiles = process.env.CHANGED_FILES || ''
const branchName = process.env.BRANCH_NAME || ''

if (!changedFiles) {
  console.log('No changed files provided')
  process.exit(0)
}

const files = changedFiles.split('\n').filter(Boolean)

console.log('Processing changed files:', files.length)

const cwd = process.cwd()
const webAppRoot = path.join(cwd, 'apps/web')
const packagesRoot = path.join(cwd, 'packages')

/**
 * Parse import statements from a TypeScript/JavaScript file
 * Returns an array of imported module paths
 */
function parseImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const imports = []

    // Match various import patterns:
    // import X from 'path'
    // import { X } from 'path'
    // import * as X from 'path'
    // import 'path'
    // export { X } from 'path'
    // export * from 'path'
    const importRegex = /(?:import|export)\s+(?:(?:\{[^}]*\}|[\w*\s,]+)\s+from\s+)?['"]([^'"]+)['"]/g

    let match
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1])
    }

    // Also match dynamic imports: import('path')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1])
    }

    // Also match require statements: require('path')
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1])
    }

    return imports
  } catch (error) {
    return []
  }
}

/**
 * Try to resolve a path to an actual file (handling index files and extensions)
 */
function resolveToFile(basePath) {
  const extensions = ['.tsx', '.ts', '.jsx', '.js']

  // Try exact path with extensions
  for (const ext of extensions) {
    const withExt = basePath + ext
    if (fs.existsSync(withExt)) {
      return withExt
    }
  }

  // Try as directory with index file
  for (const ext of extensions) {
    const indexPath = path.join(basePath, `index${ext}`)
    if (fs.existsSync(indexPath)) {
      return indexPath
    }
  }

  // Already has extension
  if (fs.existsSync(basePath)) {
    return basePath
  }

  return null
}

/**
 * Resolve an import path to an absolute file path
 */
function resolveImportPath(importPath, fromFile) {
  const fromDir = path.dirname(fromFile)

  // Handle alias paths (e.g., @/components/...)
  if (importPath.startsWith('@/')) {
    const resolved = path.join(webAppRoot, 'src', importPath.slice(2))
    return resolveToFile(resolved)
  }

  if (importPath.startsWith('@/public/')) {
    // Skip public assets
    return null
  }

  // Handle workspace packages
  if (importPath.startsWith('@safe-global/store/')) {
    const resolved = path.join(packagesRoot, 'store/src', importPath.replace('@safe-global/store/', ''))
    return resolveToFile(resolved)
  }

  if (importPath.startsWith('@safe-global/store')) {
    const resolved = path.join(packagesRoot, 'store/src')
    return resolveToFile(resolved)
  }

  if (importPath.startsWith('@safe-global/utils/')) {
    const resolved = path.join(packagesRoot, 'utils/src', importPath.replace('@safe-global/utils/', ''))
    return resolveToFile(resolved)
  }

  if (importPath.startsWith('@safe-global/utils')) {
    const resolved = path.join(packagesRoot, 'utils/src')
    return resolveToFile(resolved)
  }

  // Handle relative imports
  if (importPath.startsWith('.')) {
    const resolved = path.resolve(fromDir, importPath)
    return resolveToFile(resolved)
  }

  // External package - skip
  return null
}

/**
 * Get all source files in a directory recursively
 */
function getAllSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (['node_modules', '.next', 'dist', 'out', 'coverage', 'types'].includes(entry.name)) {
        continue
      }
      getAllSourceFiles(fullPath, files)
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      // Skip test and story files
      if (!entry.name.includes('.test.') && !entry.name.includes('.stories.') && !entry.name.includes('.spec.')) {
        files.push(fullPath)
      }
    }
  }

  return files
}

/**
 * Build a reverse dependency map: file -> files that import it
 */
function buildReverseDependencyMap(sourceFiles) {
  console.log(`\nBuilding dependency graph from ${sourceFiles.length} files...`)

  // Map: absolute file path -> Set of files that import it
  const reverseDeps = new Map()

  // Initialize all files in the map
  for (const file of sourceFiles) {
    reverseDeps.set(file, new Set())
  }

  let resolvedCount = 0
  let unresolvedCount = 0

  // Process each file's imports
  for (const file of sourceFiles) {
    const imports = parseImports(file)

    for (const importPath of imports) {
      const resolvedPath = resolveImportPath(importPath, file)

      if (resolvedPath) {
        if (reverseDeps.has(resolvedPath)) {
          // Add this file as a dependent of the imported file
          reverseDeps.get(resolvedPath).add(file)
          resolvedCount++
        }
      } else if (importPath.startsWith('.') || importPath.startsWith('@/')) {
        unresolvedCount++
      }
    }
  }

  console.log(`Resolved ${resolvedCount} internal imports, ${unresolvedCount} unresolved`)

  return reverseDeps
}

/**
 * Find all files that depend on a given file (recursively)
 */
function findAllDependents(file, reverseDeps, visited = new Set()) {
  if (visited.has(file)) {
    return new Set()
  }
  visited.add(file)

  const dependents = new Set()
  const directDependents = reverseDeps.get(file) || new Set()

  for (const dependent of directDependents) {
    dependents.add(dependent)
    // Recursively find files that depend on this dependent
    const transitiveDeps = findAllDependents(dependent, reverseDeps, visited)
    for (const dep of transitiveDeps) {
      dependents.add(dep)
    }
  }

  return dependents
}

/**
 * Check if a file is a page file
 */
function isPageFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/')
  return (
    normalized.includes('/src/pages/') &&
    !normalized.includes('_app') &&
    !normalized.includes('_document') &&
    !normalized.includes('_offline')
  )
}

/**
 * Convert a page file path to its route
 */
function pageFileToRoute(filePath) {
  const normalized = filePath.replace(/\\/g, '/')

  // Extract the route part from the path
  const match = normalized.match(/\/src\/pages(.+)\.(tsx?|jsx?)$/)
  if (!match) return null

  let route = match[1]
    .replace(/\/index$/, '') // Remove /index suffix
    .replace(/\[([^\]]+)\]/g, ':$1') // Convert [param] to :param

  return route || '/'
}

// Main execution

// Get all source files
console.log('Scanning source files...')
const webSrcFiles = getAllSourceFiles(path.join(webAppRoot, 'src'))
const packageFiles = getAllSourceFiles(packagesRoot)
const allSourceFiles = [...webSrcFiles, ...packageFiles]

console.log(`Found ${allSourceFiles.length} source files (${webSrcFiles.length} web, ${packageFiles.length} packages)`)

// Build reverse dependency map
const reverseDeps = buildReverseDependencyMap(allSourceFiles)

// Find all page files
const pageFiles = allSourceFiles.filter(isPageFile)
console.log(`Found ${pageFiles.length} page files`)

// Process changed files
const affectedPages = new Set()
const changedToPages = new Map()

for (const changedFile of files) {
  // Normalize the path to absolute
  let absolutePath = changedFile

  if (!path.isAbsolute(changedFile)) {
    absolutePath = path.join(cwd, changedFile)
  }

  // Resolve to actual file (handles missing extensions, index files)
  const resolvedPath = resolveToFile(absolutePath) || absolutePath

  if (!fs.existsSync(resolvedPath)) {
    console.log(`\nSkipping (not found): ${changedFile}`)
    continue
  }

  console.log(`\nAnalyzing: ${changedFile}`)
  console.log(`  Resolved to: ${resolvedPath}`)

  // Check if changed file is itself a page
  if (isPageFile(resolvedPath)) {
    affectedPages.add(resolvedPath)
    console.log(`  -> Direct page file`)
  }

  // Find all files that depend on this file
  const dependents = findAllDependents(resolvedPath, reverseDeps)
  console.log(`  -> Found ${dependents.size} dependent files`)

  // Filter to just page files
  const dependentPages = Array.from(dependents).filter(isPageFile)
  if (dependentPages.length > 0) {
    console.log(`  -> Affects ${dependentPages.length} page(s):`)
    for (const page of dependentPages) {
      const route = pageFileToRoute(page)
      console.log(`     ${route}`)
      affectedPages.add(page)
    }
  }

  changedToPages.set(changedFile, dependentPages)
}

// Convert affected pages to routes
const affectedRoutes = new Set()
for (const page of affectedPages) {
  const route = pageFileToRoute(page)
  if (route) {
    affectedRoutes.add(route)
  }
}

// Filter to only screenshottable routes
const screenshottableRouteSet = new Set(SCREENSHOTTABLE_ROUTES.map((r) => r.route))
let finalRoutes = Array.from(affectedRoutes).filter((route) => {
  // Handle parameterized routes - check if base route is screenshottable
  if (screenshottableRouteSet.has(route)) {
    return true
  }
  // For dynamic routes like /transactions/tx, check if /transactions is screenshottable
  const baseRoute = route.replace(/\/:[^/]+/g, '')
  return screenshottableRouteSet.has(baseRoute)
})

// If more than 10 routes are affected, limit to just one screenshot
// This avoids excessive screenshots for widely-used components
const MAX_ROUTES = 10
if (finalRoutes.length > MAX_ROUTES) {
  console.log(`\nNote: ${finalRoutes.length} routes affected, limiting to 1 screenshot`)
  // Exclude address-book as it depends on localStorage data and won't render well
  const preferredRoutes = finalRoutes.filter((r) => r !== '/address-book')
  finalRoutes = [preferredRoutes[0] || finalRoutes[0]]
}

console.log('\n=== Affected Routes ===')
if (finalRoutes.length === 0) {
  console.log('No screenshottable routes affected')
} else {
  console.log(finalRoutes.join('\n'))
}

// Build URL list for screenshot capture
const urlList = finalRoutes
  .map((route) => {
    const routeConfig = SCREENSHOTTABLE_ROUTES.find((r) => r.route === route)
    if (!routeConfig) {
      return null
    }

    const baseUrl = `https://${branchName}--walletweb.review.5afe.dev`
    let url = `${baseUrl}${route}`
    if (routeConfig.requiresSafe) {
      url += `?safe=${TEST_SAFE}`
    }

    return {
      url,
      route,
      name: routeConfig.name,
      waitForSelector: routeConfig.waitForSelector,
    }
  })
  .filter(Boolean)

console.log('\n=== Screenshot URLs ===')
console.log(JSON.stringify(urlList, null, 2))

// Write output for next step
fs.mkdirSync('page-screenshots', { recursive: true })
fs.writeFileSync('page-screenshots/routes.json', JSON.stringify(urlList, null, 2))

// Output for GitHub Actions
const outputFile = process.env.GITHUB_OUTPUT
if (outputFile) {
  fs.appendFileSync(outputFile, `routes=${JSON.stringify(urlList)}\n`)
  fs.appendFileSync(outputFile, `has_routes=${urlList.length > 0}\n`)
  fs.appendFileSync(outputFile, `route_count=${urlList.length}\n`)
}

console.log(`\nGenerated ${urlList.length} routes for screenshots`)
