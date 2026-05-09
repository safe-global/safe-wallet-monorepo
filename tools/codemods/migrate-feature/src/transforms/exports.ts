/**
 * Transform: Convert named exports to default exports
 */

import { readFile, writeFile } from '../utils.js'

/**
 * Detect if a file has a named export that should be default
 * (function declarations or const arrow functions)
 */
export function detectNamedExport(content: string): {
  hasNamedExport: boolean
  exportName: string | null
  exportType: 'function' | 'const' | null
} {
  // Match: export function ComponentName() or export const ComponentName =
  const functionMatch = content.match(/export\s+function\s+(\w+)\s*\(/m)
  if (functionMatch) {
    return {
      hasNamedExport: true,
      exportName: functionMatch[1]!,
      exportType: 'function',
    }
  }

  const constMatch = content.match(/export\s+const\s+(\w+)\s*=/m)
  if (constMatch) {
    return {
      hasNamedExport: true,
      exportName: constMatch[1]!,
      exportType: 'const',
    }
  }

  return {
    hasNamedExport: false,
    exportName: null,
    exportType: null,
  }
}

/**
 * Convert named function export to default export
 */
export function convertFunctionExport(content: string, exportName: string): string {
  // Replace: export function Name() => export default function Name()
  return content.replace(
    new RegExp(`export\\s+function\\s+${exportName}\\s*\\(`, 'm'),
    `export default function ${exportName}(`,
  )
}

/**
 * Convert named const export to default export
 */
export function convertConstExport(content: string, exportName: string): string {
  // Replace: export const Name = ... => const Name = ...\n\nexport default Name

  // First, remove the 'export' keyword from the const declaration
  let updated = content.replace(new RegExp(`export\\s+const\\s+${exportName}\\s*=`, 'm'), `const ${exportName} =`)

  // Then add default export at the end (before any existing default export)
  // Check if there's already a default export
  if (!updated.includes('export default')) {
    updated += `\n\nexport default ${exportName}\n`
  }

  return updated
}

/**
 * Convert a file's named export to default export
 */
export function convertToDefaultExport(filePath: string): {
  success: boolean
  converted: boolean
  exportName?: string
  error?: string
} {
  const content = readFile(filePath)
  if (!content) {
    return { success: false, converted: false, error: 'Failed to read file' }
  }

  const detection = detectNamedExport(content)
  if (!detection.hasNamedExport || !detection.exportName) {
    return { success: true, converted: false }
  }

  let updated: string
  if (detection.exportType === 'function') {
    updated = convertFunctionExport(content, detection.exportName)
  } else if (detection.exportType === 'const') {
    updated = convertConstExport(content, detection.exportName)
  } else {
    return { success: false, converted: false, error: 'Unknown export type' }
  }

  const writeSuccess = writeFile(filePath, updated)
  if (!writeSuccess) {
    return { success: false, converted: false, error: 'Failed to write file' }
  }

  return {
    success: true,
    converted: true,
    exportName: detection.exportName,
  }
}

/**
 * Process multiple files and convert their exports
 */
export function convertExportsInFiles(
  filePaths: string[],
  dryRun: boolean = false,
): {
  filesProcessed: number
  filesConverted: number
  conversions: Array<{ file: string; exportName: string }>
  errors: string[]
} {
  const conversions: Array<{ file: string; exportName: string }> = []
  const errors: string[] = []
  let filesProcessed = 0
  let filesConverted = 0

  for (const filePath of filePaths) {
    filesProcessed++

    if (dryRun) {
      const content = readFile(filePath)
      if (!content) {
        errors.push(`Failed to read ${filePath}`)
        continue
      }

      const detection = detectNamedExport(content)
      if (detection.hasNamedExport && detection.exportName) {
        console.log(`Would convert: ${filePath} (${detection.exportName})`)
        filesConverted++
        conversions.push({ file: filePath, exportName: detection.exportName })
      }
      continue
    }

    const result = convertToDefaultExport(filePath)
    if (!result.success) {
      errors.push(`Failed to convert ${filePath}: ${result.error}`)
    } else if (result.converted && result.exportName) {
      filesConverted++
      conversions.push({ file: filePath, exportName: result.exportName })
    }
  }

  return {
    filesProcessed,
    filesConverted,
    conversions,
    errors,
  }
}
