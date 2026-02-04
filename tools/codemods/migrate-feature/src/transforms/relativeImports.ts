/**
 * Transform: Update relative imports after file reorganization
 */

import * as path from 'path'
import { readFile, writeFile } from '../utils.js'

interface FileMove {
  from: string
  to: string
}

interface ImportUpdate {
  filePath: string
  updates: Array<{
    oldImport: string
    newImport: string
    line: number
  }>
}

/**
 * Parse import statements from a file
 */
function parseImports(content: string): Array<{
  statement: string
  path: string
  isDefault: boolean
  names: string[]
  line: number
}> {
  const imports: Array<{
    statement: string
    path: string
    isDefault: boolean
    names: string[]
    line: number
  }> = []

  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (!line.includes('import')) continue

    // Match: import Something from './path'
    const defaultMatch = line.match(/import\s+(\w+)\s+from\s+['"](\.\.?\/[^'"]+)['"]/)
    if (defaultMatch) {
      imports.push({
        statement: line,
        path: defaultMatch[2]!,
        isDefault: true,
        names: [defaultMatch[1]!],
        line: i + 1,
      })
      continue
    }

    // Match: import { Named } from './path'
    const namedMatch = line.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"](\.\.?\/[^'"]+)['"]/)
    if (namedMatch) {
      const names = namedMatch[1]!
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
      imports.push({
        statement: line,
        path: namedMatch[2]!,
        isDefault: false,
        names,
        line: i + 1,
      })
      continue
    }

    // Match: import type { Named } from './path'
    const typeMatch = line.match(/import\s+type\s+\{\s*([^}]+)\s*\}\s+from\s+['"](\.\.?\/[^'"]+)['"]/)
    if (typeMatch) {
      const names = typeMatch[1]!
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
      imports.push({
        statement: line,
        path: typeMatch[2]!,
        isDefault: false,
        names,
        line: i + 1,
      })
      continue
    }

    // Match: import type Something from './path'
    const defaultTypeMatch = line.match(/import\s+type\s+(\w+)\s+from\s+['"](\.\.?\/[^'"]+)['"]/)
    if (defaultTypeMatch) {
      imports.push({
        statement: line,
        path: defaultTypeMatch[2]!,
        isDefault: true,
        names: [defaultTypeMatch[1]!],
        line: i + 1,
      })
    }
  }

  return imports
}

/**
 * Resolve a relative import path to absolute path
 */
function resolveImportPath(fromFile: string, importPath: string): string {
  const dir = path.dirname(fromFile)
  const resolved = path.resolve(dir, importPath)

  // Try with common extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx']
  for (const ext of extensions) {
    const withExt = resolved + ext
    if (withExt) return withExt
  }

  // Try as index file
  for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
    const indexPath = path.join(resolved, `index${ext}`)
    if (indexPath) return indexPath
  }

  return resolved
}

/**
 * Calculate new import path after file moves
 */
function calculateNewImportPath(fromFile: string, oldImportPath: string, fileMoves: FileMove[]): string | null {
  // Resolve the old import to absolute path
  const oldAbsolutePath = resolveImportPath(fromFile, oldImportPath)

  // Check if the imported file was moved
  const move = fileMoves.find((m) => {
    // Remove extension for comparison
    const fromWithoutExt = m.from.replace(/\.(tsx?|jsx?)$/, '')
    const oldWithoutExt = oldAbsolutePath.replace(/\.(tsx?|jsx?)$/, '')
    return fromWithoutExt === oldWithoutExt || m.from === oldAbsolutePath
  })

  if (!move) {
    // File wasn't moved, no update needed
    return null
  }

  // Calculate new relative path from current file to moved file
  const dir = path.dirname(fromFile)
  let newRelativePath = path.relative(dir, move.to)

  // Remove extension
  newRelativePath = newRelativePath.replace(/\.(tsx?|jsx?)$/, '')

  // Ensure it starts with ./ or ../
  if (!newRelativePath.startsWith('.')) {
    newRelativePath = './' + newRelativePath
  }

  return newRelativePath
}

/**
 * Update imports in a file based on file moves
 */
export function updateRelativeImports(
  filePath: string,
  fileMoves: FileMove[],
  componentExports: Map<string, string>, // Map of file path to export name
): ImportUpdate | null {
  const content = readFile(filePath)
  if (!content) return null

  const imports = parseImports(content)
  if (imports.length === 0) return null

  const updates: Array<{
    oldImport: string
    newImport: string
    line: number
  }> = []

  for (const imp of imports) {
    const newPath = calculateNewImportPath(filePath, imp.path, fileMoves)
    if (!newPath) continue

    // Check if we need to update named to default import
    const targetFile = resolveImportPath(filePath, imp.path)
    const exportName = componentExports.get(targetFile)

    let newStatement: string
    if (exportName && !imp.isDefault && imp.names.includes(exportName)) {
      // Convert named import to default import
      const isTypeImport = imp.statement.includes('import type')
      if (isTypeImport) {
        newStatement = `import type ${exportName} from '${newPath}'`
      } else {
        newStatement = `import ${exportName} from '${newPath}'`
      }
    } else {
      // Just update the path
      newStatement = imp.statement.replace(imp.path, newPath)
    }

    if (newStatement !== imp.statement) {
      updates.push({
        oldImport: imp.statement,
        newImport: newStatement,
        line: imp.line,
      })
    }
  }

  if (updates.length === 0) return null

  return {
    filePath,
    updates,
  }
}

/**
 * Apply import updates to a file
 */
export function applyImportUpdates(filePath: string, updates: ImportUpdate): boolean {
  const content = readFile(filePath)
  if (!content) return false

  let updated = content

  // Apply updates (in reverse order to preserve line numbers)
  const sortedUpdates = [...updates.updates].sort((a, b) => b.line - a.line)

  for (const update of sortedUpdates) {
    updated = updated.replace(update.oldImport, update.newImport)
  }

  return writeFile(filePath, updated)
}

/**
 * Process all moved files and update their imports
 */
export function updateImportsInMovedFiles(
  fileMoves: FileMove[],
  componentExports: Map<string, string>,
  dryRun: boolean = false,
): {
  filesProcessed: number
  filesUpdated: number
  totalUpdates: number
  details: Array<{ file: string; updates: number }>
  errors: string[]
} {
  const details: Array<{ file: string; updates: number }> = []
  const errors: string[] = []
  let filesProcessed = 0
  let filesUpdated = 0
  let totalUpdates = 0

  // Process each moved file
  for (const move of fileMoves) {
    filesProcessed++

    const importUpdate = updateRelativeImports(move.to, fileMoves, componentExports)
    if (!importUpdate) continue

    if (dryRun) {
      console.log(`\nWould update imports in: ${path.basename(path.dirname(move.to))}`)
      importUpdate.updates.forEach((u) => {
        console.log(`  Line ${u.line}: ${u.oldImport}`)
        console.log(`         → ${u.newImport}`)
      })
      filesUpdated++
      totalUpdates += importUpdate.updates.length
      details.push({
        file: move.to,
        updates: importUpdate.updates.length,
      })
      continue
    }

    const success = applyImportUpdates(move.to, importUpdate)
    if (!success) {
      errors.push(`Failed to update imports in ${move.to}`)
    } else {
      filesUpdated++
      totalUpdates += importUpdate.updates.length
      details.push({
        file: move.to,
        updates: importUpdate.updates.length,
      })
    }
  }

  return {
    filesProcessed,
    filesUpdated,
    totalUpdates,
    details,
    errors,
  }
}
