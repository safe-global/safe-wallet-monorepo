/**
 * Phase 2: Execute migration based on config
 */

import * as fs from 'fs'
import * as path from 'path'
import type { FeatureConfig, MigrationResult } from './types.js'
import { getFeaturePath, writeFile, formatTypeScript, findFiles } from './utils.js'
import { generateContractTemplate, generateFeatureTemplate, generateIndexTemplate } from './templates.js'
import { ensureFolderStructure, planFileReorganization, executeFileReorganization } from './transforms/fileStructure.js'
import { transformConsumerFile } from './transforms/imports.js'
import { convertExportsInFiles } from './transforms/exports.js'
import { updateImportsInMovedFiles } from './transforms/relativeImports.js'

/**
 * Execute the complete migration
 */
export async function executeMigration(config: FeatureConfig, dryRun: boolean = false): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    filesCreated: [],
    filesModified: [],
    filesMoved: [],
    errors: [],
    warnings: [],
  }

  const featurePath = getFeaturePath(config.featureName)

  console.log(`\n🚀 Starting migration for feature: ${config.featureName}`)
  console.log(dryRun ? '   (DRY RUN - no files will be modified)\n' : '')

  // Step 1: Ensure folder structure
  console.log('📁 Step 1: Setting up folder structure...')
  ensureFolderStructure(config, dryRun)

  // Step 2: Plan and execute file reorganization
  console.log('📋 Step 2: Planning file reorganization...')
  const moves = planFileReorganization(config)

  if (moves.length > 0) {
    console.log(`   Found ${moves.length} file(s) to reorganize`)
    const moveResult = executeFileReorganization(moves, dryRun)

    if (!moveResult.success) {
      result.errors.push(...moveResult.errors)
      result.success = false
    } else {
      result.filesMoved = moves.map((m) => m.to)
    }
  } else {
    console.log('   No files need reorganization')
  }

  // Step 3: Convert named exports to default exports
  console.log('🔄 Step 3: Converting exports to default pattern...')

  // Find all component files (in components folder or feature root)
  const componentFiles: string[] = []
  const componentsPath = path.join(featurePath, 'components')

  if (fs.existsSync(componentsPath)) {
    // Find index.tsx files in component folders
    const componentFolders = fs.readdirSync(componentsPath).filter((name) => {
      const fullPath = path.join(componentsPath, name)
      return fs.statSync(fullPath).isDirectory()
    })

    for (const folder of componentFolders) {
      const indexFile = path.join(componentsPath, folder, 'index.tsx')
      if (fs.existsSync(indexFile)) {
        componentFiles.push(indexFile)
      }
    }
  }

  // Build a map of component exports for import updates
  const componentExports = new Map<string, string>()

  if (componentFiles.length > 0) {
    const exportResult = convertExportsInFiles(componentFiles, dryRun)

    // Build export map from conversion results
    if (!dryRun) {
      exportResult.conversions.forEach((c) => {
        componentExports.set(c.file, c.exportName)
      })
    }

    if (dryRun) {
      console.log(`   Would convert ${exportResult.filesConverted} component(s) to default exports`)
    } else {
      if (exportResult.filesConverted > 0) {
        console.log(`   ✓ Converted ${exportResult.filesConverted} component(s) to default exports`)
        exportResult.conversions.forEach((c) => {
          console.log(`     - ${path.basename(path.dirname(c.file))}: ${c.exportName}`)
        })
      } else {
        console.log('   No export conversions needed')
      }

      if (exportResult.errors.length > 0) {
        result.errors.push(...exportResult.errors)
      }
    }
  } else {
    console.log('   No component files found')
  }

  // Step 3.5: Update relative imports in moved files
  if (moves.length > 0) {
    console.log('🔗 Step 3.5: Updating relative imports...')

    const importUpdateResult = updateImportsInMovedFiles(moves, componentExports, dryRun)

    if (dryRun) {
      if (importUpdateResult.filesUpdated > 0) {
        console.log(
          `   Would update imports in ${importUpdateResult.filesUpdated} file(s) (${importUpdateResult.totalUpdates} import(s))`,
        )
      } else {
        console.log('   No import updates needed')
      }
    } else {
      if (importUpdateResult.filesUpdated > 0) {
        console.log(
          `   ✓ Updated imports in ${importUpdateResult.filesUpdated} file(s) (${importUpdateResult.totalUpdates} import(s))`,
        )
        importUpdateResult.details.forEach((d) => {
          console.log(`     - ${path.basename(path.dirname(d.file))}: ${d.updates} import(s)`)
        })
      } else {
        console.log('   No import updates needed')
      }

      if (importUpdateResult.errors.length > 0) {
        result.errors.push(...importUpdateResult.errors)
      }
    }
  }

  // Step 4: Generate boilerplate files
  console.log('📝 Step 4: Generating boilerplate files...')

  // Generate contract.ts
  const contractPath = path.join(featurePath, 'contract.ts')
  if (!fs.existsSync(contractPath)) {
    const contractContent = formatTypeScript(generateContractTemplate(config))

    if (dryRun) {
      console.log(`   Would create: contract.ts`)
    } else {
      const success = writeFile(contractPath, contractContent)
      if (success) {
        result.filesCreated.push(contractPath)
        console.log('   ✓ Created contract.ts')
      } else {
        result.errors.push('Failed to create contract.ts')
        result.success = false
      }
    }
  } else {
    result.warnings.push('contract.ts already exists, skipping')
  }

  // Generate feature.ts
  const featureFilePath = path.join(featurePath, 'feature.ts')
  if (!fs.existsSync(featureFilePath)) {
    const featureContent = formatTypeScript(generateFeatureTemplate(config))

    if (dryRun) {
      console.log(`   Would create: feature.ts`)
    } else {
      const success = writeFile(featureFilePath, featureContent)
      if (success) {
        result.filesCreated.push(featureFilePath)
        console.log('   ✓ Created feature.ts')
      } else {
        result.errors.push('Failed to create feature.ts')
        result.success = false
      }
    }
  } else {
    result.warnings.push('feature.ts already exists, skipping')
  }

  // Generate index.ts
  const indexPath = path.join(featurePath, 'index.ts')
  if (!fs.existsSync(indexPath)) {
    const indexContent = formatTypeScript(generateIndexTemplate(config))

    if (dryRun) {
      console.log(`   Would create: index.ts`)
    } else {
      const success = writeFile(indexPath, indexContent)
      if (success) {
        result.filesCreated.push(indexPath)
        console.log('   ✓ Created index.ts')
      } else {
        result.errors.push('Failed to create index.ts')
        result.success = false
      }
    }
  } else {
    result.warnings.push('index.ts already exists, skipping')
  }

  // Step 5: Update consumer files
  console.log('🔄 Step 5: Updating consumer files...')

  if (config.consumers.length === 0) {
    console.log('   No consumers found')
  } else {
    console.log(`   Found ${config.consumers.length} consumer file(s)`)

    for (const consumer of config.consumers) {
      const transformResult = transformConsumerFile(consumer.filePath, config.featureName, dryRun)

      if (transformResult.success) {
        result.filesModified.push(consumer.filePath)
      } else {
        result.errors.push(`Failed to transform ${consumer.filePath}: ${transformResult.error}`)
      }
    }

    if (!dryRun) {
      console.log(`   ✓ Updated ${result.filesModified.length} consumer file(s)`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  if (result.success) {
    console.log('✅ Migration completed successfully!')
  } else {
    console.log('❌ Migration completed with errors')
  }

  console.log('\nSummary:')
  console.log(`  Files created: ${result.filesCreated.length}`)
  console.log(`  Files modified: ${result.filesModified.length}`)
  console.log(`  Files moved: ${result.filesMoved.length}`)

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`)
    result.warnings.forEach((w) => console.log(`  - ${w}`))
  }

  if (result.errors.length > 0) {
    console.log(`\n❌ Errors:`)
    result.errors.forEach((e) => console.log(`  - ${e}`))
  }

  // Manual steps
  console.log('\n📋 Manual steps required:')
  console.log('  1. Review generated contract.ts and adjust public API as needed')
  console.log('  2. Review consumer files and complete the migration:')
  console.log('     - Add: const feature = useLoadFeature(FeatureNameFeature)')
  console.log('     - Replace: <Component /> → <feature.Component />')
  console.log('     - Import hooks directly: import { useMyHook } from "@/features/feature-name"')
  console.log('     - Replace: service.method() → feature.service?.method() (check $isReady for services)')
  console.log('  3. Keep hooks lightweight - move heavy imports to services if needed')
  console.log('  4. Update test file imports if needed')
  console.log('  5. Run: yarn workspace @safe-global/web type-check')
  console.log('  6. Run: yarn workspace @safe-global/web lint')
  console.log('  7. Run: yarn workspace @safe-global/web test')
  console.log('=' + '='.repeat(59))

  return result
}
