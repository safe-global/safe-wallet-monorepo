/**
 * Utility functions for the migration tool
 */

import * as fs from 'fs'
import * as path from 'path'
import type { ExportType } from './types.js'

/**
 * Get the feature path relative to the project root
 */
export function getFeaturePath(featureName: string): string {
  return path.join(process.cwd(), 'apps', 'web', 'src', 'features', featureName)
}

/**
 * Check if a feature exists
 */
export function featureExists(featureName: string): boolean {
  const featurePath = getFeaturePath(featureName)
  return fs.existsSync(featurePath) && fs.statSync(featurePath).isDirectory()
}

/**
 * Get all features in the project
 */
export function getAllFeatures(): string[] {
  const featuresPath = path.join(process.cwd(), 'apps', 'web', 'src', 'features')
  return fs
    .readdirSync(featuresPath)
    .filter((name) => {
      const fullPath = path.join(featuresPath, name)
      return fs.statSync(fullPath).isDirectory() && name !== '__core__'
    })
    .sort()
}

/**
 * Check if a feature has already been migrated
 */
export function isFeatureMigrated(featureName: string): boolean {
  const featurePath = getFeaturePath(featureName)
  const hasContract = fs.existsSync(path.join(featurePath, 'contract.ts'))
  const hasFeature = fs.existsSync(path.join(featurePath, 'feature.ts'))
  const hasIndex = fs.existsSync(path.join(featurePath, 'index.ts'))

  return hasContract && hasFeature && hasIndex
}

/**
 * Determine export type based on naming conventions
 */
export function getExportType(name: string): ExportType {
  // Type exports (uppercase with underscores or PascalCase ending in Type/Props/Config/Data)
  if (/^[A-Z_]+$/.test(name) || /(Type|Props|Config|Options|Data|State|Event|Interface)$/.test(name)) {
    return 'type'
  }

  // Hooks (useSomething)
  if (name.startsWith('use') && name[3] === name[3]?.toUpperCase()) {
    return 'hook'
  }

  // Components (PascalCase)
  if (name[0] === name[0]?.toUpperCase() && !name.includes('_')) {
    return 'component'
  }

  // Constants (UPPER_SNAKE_CASE)
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
    return 'constant'
  }

  // Services (camelCase)
  if (name[0] === name[0]?.toLowerCase()) {
    return 'service'
  }

  return 'unknown'
}

/**
 * Convert feature name to feature flag constant name
 */
export function featureNameToFlag(featureName: string): string {
  return featureName
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .replace(/-/g, '_') // kebab-case to snake_case
    .toUpperCase()
}

/**
 * Convert PascalCase to kebab-case
 */
export function pascalToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Convert kebab-case to PascalCase
 */
export function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Recursively find all files matching a pattern in a directory
 */
export function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = []

  if (!fs.existsSync(dir)) {
    return results
  }

  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist, etc.
      if (!['node_modules', '.next', 'dist', 'build', '__tests__'].includes(file)) {
        results.push(...findFiles(filePath, pattern))
      }
    } else if (pattern.test(file)) {
      results.push(filePath)
    }
  }

  return results
}

/**
 * Read file content safely
 */
export function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Write file content safely
 */
export function writeFile(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  } catch {
    return false
  }
}

/**
 * Move a file safely
 */
export function moveFile(from: string, to: string): boolean {
  try {
    const dir = path.dirname(to)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.renameSync(from, to)
    return true
  } catch {
    return false
  }
}

/**
 * Get relative import path between two files
 */
export function getRelativeImportPath(from: string, to: string): string {
  let relativePath = path.relative(path.dirname(from), to)

  // Remove .ts/.tsx extension
  relativePath = relativePath.replace(/\.(ts|tsx)$/, '')

  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath
  }

  return relativePath
}

/**
 * Format TypeScript code with basic formatting
 */
export function formatTypeScript(code: string): string {
  // Basic formatting - in production, you'd use prettier
  return code
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim()
}
