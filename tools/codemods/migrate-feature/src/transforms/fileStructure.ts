/**
 * Transform: Reorganize feature file structure
 */

import * as fs from 'fs'
import * as path from 'path'
import type { FeatureConfig } from '../types.js'
import { getFeaturePath, moveFile } from '../utils.js'

export interface FileMove {
  from: string
  to: string
}

/**
 * Determine target folder for a file based on its purpose
 */
function determineTargetFolder(
  filePath: string,
  config: FeatureConfig,
): 'components' | 'hooks' | 'services' | 'store' | null {
  const fileName = path.basename(filePath, path.extname(filePath))

  // Check if it's a component
  if (config.publicAPI.components.includes(fileName)) {
    return 'components'
  }

  // Check if it's a hook
  if (config.publicAPI.hooks.includes(fileName)) {
    return 'hooks'
  }

  // Check if it's a service
  if (config.publicAPI.services.includes(fileName)) {
    return 'services'
  }

  // Check if it's in store-related file
  if (fileName.includes('slice') || fileName.includes('Store') || fileName.includes('selector')) {
    return 'store'
  }

  return null
}

/**
 * Plan file moves for reorganizing feature structure
 */
export function planFileReorganization(config: FeatureConfig): FileMove[] {
  const featurePath = getFeaturePath(config.featureName)
  const moves: FileMove[] = []

  // Get all TypeScript files in the feature root
  const rootFiles = fs
    .readdirSync(featurePath)
    .filter(
      (file) =>
        (file.endsWith('.ts') || file.endsWith('.tsx')) &&
        !['index.ts', 'contract.ts', 'feature.ts', 'types.ts', 'constants.ts'].includes(file),
    )

  for (const file of rootFiles) {
    const filePath = path.join(featurePath, file)
    const targetFolder = determineTargetFolder(filePath, config)

    if (targetFolder) {
      const targetPath = path.join(featurePath, targetFolder, file)

      // If the file is a component, create a folder for it
      if (targetFolder === 'components' && file.endsWith('.tsx')) {
        const componentName = path.basename(file, '.tsx')
        const componentFolder = path.join(featurePath, targetFolder, componentName)
        const indexPath = path.join(componentFolder, 'index.tsx')

        moves.push({
          from: filePath,
          to: indexPath,
        })
      } else {
        moves.push({
          from: filePath,
          to: targetPath,
        })
      }
    }
  }

  return moves
}

/**
 * Execute file reorganization
 */
export function executeFileReorganization(
  moves: FileMove[],
  dryRun: boolean = false,
): { success: boolean; errors: string[] } {
  const errors: string[] = []

  for (const move of moves) {
    if (dryRun) {
      console.log(`Would move: ${move.from} → ${move.to}`)
      continue
    }

    const success = moveFile(move.from, move.to)
    if (!success) {
      errors.push(`Failed to move ${move.from} to ${move.to}`)
    }
  }

  return {
    success: errors.length === 0,
    errors,
  }
}

/**
 * Ensure required folders exist
 */
export function ensureFolderStructure(config: FeatureConfig, dryRun: boolean = false): void {
  const featurePath = getFeaturePath(config.featureName)

  const folders = ['components', 'hooks', 'services', 'store']

  for (const folder of folders) {
    const folderPath = path.join(featurePath, folder)

    if (!fs.existsSync(folderPath)) {
      if (dryRun) {
        console.log(`Would create folder: ${folderPath}`)
      } else {
        fs.mkdirSync(folderPath, { recursive: true })
      }
    }
  }
}
