/**
 * Transform: Update import statements in consumer files
 */

import type { FeatureConfig } from '../types.js'

// Type definitions for jscodeshift (will be available at runtime)
interface FileInfo {
  path: string
  source: string
}

interface API {
  jscodeshift: any
  j: any
  stats: () => void
}

interface Options {
  [key: string]: any
}

/**
 * JSCodeshift transform to update imports from feature internals to feature handle
 */
export function updateImportsTransform(fileInfo: FileInfo, api: API, options: Options): string | undefined {
  const j = api.jscodeshift
  const root = j(fileInfo.source)
  const { featureName } = options as { featureName: string }

  let hasChanges = false
  let needsUseLoadFeature = false
  let needsFeatureHandle = false

  // Find all imports from the feature
  const featureImports = root.find(j.ImportDeclaration, {
    source: {
      value: (value: string) => value.startsWith(`@/features/${featureName}/`),
    },
  })

  if (featureImports.length === 0) {
    return undefined
  }

  // Collect all imports to convert
  const importsToConvert: Array<{
    name: string
    isDefault: boolean
    isType: boolean
  }> = []

  featureImports.forEach((path: any) => {
    const specifiers = path.value.specifiers || []

    for (const specifier of specifiers) {
      if (specifier.type === 'ImportDefaultSpecifier') {
        importsToConvert.push({
          name: specifier.local!.name,
          isDefault: true,
          isType: path.value.importKind === 'type',
        })
      } else if (specifier.type === 'ImportSpecifier') {
        importsToConvert.push({
          name: specifier.local!.name,
          isDefault: false,
          isType: path.value.importKind === 'type' || specifier.importKind === 'type',
        })
      }
    }
  })

  // Remove old imports
  featureImports.remove()
  hasChanges = true

  // Check if we need to add imports
  const nonTypeImports = importsToConvert.filter((imp) => !imp.isType)
  if (nonTypeImports.length > 0) {
    needsUseLoadFeature = true
    needsFeatureHandle = true
  }

  // Add import for useLoadFeature if needed
  if (needsUseLoadFeature) {
    const existingCoreImport = root.find(j.ImportDeclaration, {
      source: { value: '@/features/__core__' },
    })

    if (existingCoreImport.length === 0) {
      const newImport = j.importDeclaration(
        [j.importSpecifier(j.identifier('useLoadFeature'))],
        j.literal('@/features/__core__'),
      )

      // Add at the top after other @/features imports
      const firstFeatureImport = root.find(j.ImportDeclaration, {
        source: {
          value: (value: string) => typeof value === 'string' && value.startsWith('@/features/'),
        },
      })

      if (firstFeatureImport.length > 0) {
        firstFeatureImport.at(-1).insertAfter(newImport)
      } else {
        root.find(j.Program).get('body', 0).insertBefore(newImport)
      }
    }
  }

  // Add import for feature handle if needed
  if (needsFeatureHandle) {
    const featureNamePascal = featureName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
    const handleName = `${featureNamePascal}Feature`

    const existingHandleImport = root.find(j.ImportDeclaration, {
      source: { value: `@/features/${featureName}` },
    })

    if (existingHandleImport.length === 0) {
      const newImport = j.importDeclaration(
        [j.importSpecifier(j.identifier(handleName))],
        j.literal(`@/features/${featureName}`),
      )

      // Add at the top after other @/features imports
      const firstFeatureImport = root.find(j.ImportDeclaration, {
        source: {
          value: (value: string) => typeof value === 'string' && value.startsWith('@/features/'),
        },
      })

      if (firstFeatureImport.length > 0) {
        firstFeatureImport.at(-1).insertAfter(newImport)
      } else {
        root.find(j.Program).get('body', 0).insertBefore(newImport)
      }
    }
  }

  // Add TODO comment for manual migration
  if (hasChanges) {
    // Find the main function/component
    const functionDeclarations = root.find(j.FunctionDeclaration)
    const arrowFunctions = root.find(j.VariableDeclaration, {
      declarations: [
        {
          init: { type: 'ArrowFunctionExpression' },
        },
      ],
    })

    let targetNode = functionDeclarations.at(0)
    if (functionDeclarations.length === 0 && arrowFunctions.length > 0) {
      targetNode = arrowFunctions.at(0)
    }

    if (targetNode.length > 0) {
      const comment = j.commentBlock(
        `\n * TODO: Migrate to use feature handle\n * 1. Add: const feature = useLoadFeature(${needsFeatureHandle ? featureName + 'Feature' : 'FeatureName'})\n * 2. Replace direct imports with: feature.ComponentName, feature.useHookName(), etc.\n * 3. Remove null checks where proxy stubs suffice\n `,
        true,
        false,
      )

      const node = targetNode.get().value
      node.comments = node.comments || []
      node.comments.push(comment)
    }
  }

  return hasChanges ? root.toSource() : undefined
}

/**
 * Apply import transform to a consumer file
 */
export function transformConsumerFile(
  filePath: string,
  featureName: string,
  dryRun: boolean = false,
): { success: boolean; error?: string } {
  if (dryRun) {
    console.log(`Would transform imports in: ${filePath}`)
    return { success: true }
  }

  try {
    const jscodeshift = require('jscodeshift')
    const fs = require('fs')

    const source = fs.readFileSync(filePath, 'utf-8')
    const fileInfo = { path: filePath, source }
    const api = { jscodeshift, j: jscodeshift, stats: () => {} }
    const options = { featureName }

    const result = updateImportsTransform(fileInfo, api, options)

    if (result) {
      fs.writeFileSync(filePath, result, 'utf-8')
      return { success: true }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
