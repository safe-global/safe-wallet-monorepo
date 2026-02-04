#!/usr/bin/env node

/**
 * Feature Migration Codemod CLI
 *
 * Two-phase tool for migrating features to v3 architecture:
 * - Phase 1 (Analyze): Scan feature and generate config
 * - Phase 2 (Execute): Apply transformations based on config
 */

import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import * as fs from 'fs'
import * as path from 'path'
import type { FeatureConfig } from './types.js'
import { getAllFeatures, featureExists, isFeatureMigrated } from './utils.js'
import { analyzeFeature, saveAnalysisConfig, loadAnalysisConfig } from './analyze.js'
import { executeMigration } from './execute.js'

const program = new Command()

program
  .name('migrate-feature')
  .description('Migrate a feature to v3 architecture (lazy loading + feature handles)')
  .version('1.0.0')

/**
 * Analyze command - Phase 1
 */
program
  .command('analyze')
  .description('Analyze a feature and generate migration config')
  .argument('[feature]', 'Feature name to analyze')
  .option('-i, --interactive', 'Interactive mode with prompts')
  .option('-o, --output <path>', 'Output path for config file')
  .action(async (featureName: string | undefined, options: { interactive?: boolean; output?: string }) => {
    try {
      console.log(chalk.blue.bold('\n🔍 Feature Migration Analyzer\n'))

      // Interactive mode: select feature
      if (!featureName || options.interactive) {
        const features = getAllFeatures()
        const unmigrated = features.filter((f) => !isFeatureMigrated(f))

        if (unmigrated.length === 0) {
          console.log(chalk.yellow('No unmigrated features found!'))
          process.exit(0)
        }

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'featureName',
            message: 'Which feature would you like to analyze?',
            choices: unmigrated.map((f) => ({
              name: `${f}${isFeatureMigrated(f) ? chalk.gray(' (migrated)') : ''}`,
              value: f,
            })),
          },
        ])

        featureName = answers.featureName
      }

      // Ensure feature name is provided
      if (!featureName) {
        console.log(chalk.red('\n❌ Feature name is required'))
        process.exit(1)
      }

      // Validate feature
      if (!featureExists(featureName)) {
        console.log(chalk.red(`\n❌ Feature "${featureName}" not found`))
        process.exit(1)
      }

      if (isFeatureMigrated(featureName)) {
        console.log(chalk.yellow(`\n⚠️  Feature "${featureName}" is already migrated`))
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Analyze anyway?',
            default: false,
          },
        ])

        if (!proceed) {
          process.exit(0)
        }
      }

      // Analyze
      console.log(chalk.cyan(`\nAnalyzing feature: ${featureName}...\n`))
      const result = await analyzeFeature(featureName)

      // Display results
      console.log(chalk.green('✓ Analysis complete!\n'))

      console.log(chalk.bold('Feature Configuration:'))
      console.log(`  Feature Name: ${result.config.featureName}`)
      console.log(`  Feature Flag: ${result.config.featureFlag}`)

      console.log(chalk.bold('\nPublic API:'))
      console.log(`  Components: ${result.config.publicAPI.components.length}`)
      if (result.config.publicAPI.components.length > 0) {
        result.config.publicAPI.components.forEach((c) => console.log(`    - ${c}`))
      }

      console.log(`  Hooks: ${result.config.publicAPI.hooks.length}`)
      if (result.config.publicAPI.hooks.length > 0) {
        result.config.publicAPI.hooks.forEach((h) => console.log(`    - ${h}`))
      }

      console.log(`  Services: ${result.config.publicAPI.services.length}`)
      if (result.config.publicAPI.services.length > 0) {
        result.config.publicAPI.services.forEach((s) => console.log(`    - ${s}`))
      }

      console.log(chalk.bold('\nStructure:'))
      console.log(`  Has components/ folder: ${result.config.structure.hasComponentsFolder ? '✓' : '✗'}`)
      console.log(`  Has hooks/ folder: ${result.config.structure.hasHooksFolder ? '✓' : '✗'}`)
      console.log(`  Has services/ folder: ${result.config.structure.hasServicesFolder ? '✓' : '✗'}`)
      console.log(`  Has store/ folder: ${result.config.structure.hasStoreFolder ? '✓' : '✗'}`)

      console.log(chalk.bold('\nConsumers:'))
      console.log(`  Found ${result.config.consumers.length} consumer file(s)`)

      // Warnings
      if (result.warnings.length > 0) {
        console.log(chalk.yellow.bold('\n⚠️  Warnings:'))
        result.warnings.forEach((w) => console.log(chalk.yellow(`  - ${w}`)))
      }

      // Suggestions
      if (result.suggestions.length > 0) {
        console.log(chalk.cyan.bold('\n💡 Suggestions:'))
        result.suggestions.forEach((s) => console.log(chalk.cyan(`  - ${s}`)))
      }

      // Save config
      const outputPath = options.output || path.join(process.cwd(), `.codemod/${featureName}.config.json`)

      const { shouldSave } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldSave',
          message: `Save config to ${outputPath}?`,
          default: true,
        },
      ])

      if (shouldSave) {
        const success = saveAnalysisConfig(result.config, outputPath)
        if (success) {
          console.log(chalk.green(`\n✓ Config saved to: ${outputPath}`))
          console.log(
            chalk.gray(`\nNext: Run ${chalk.white(`migrate-feature execute ${featureName}`)} to apply the migration`),
          )
        } else {
          console.log(chalk.red(`\n✗ Failed to save config`))
        }
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error)
      process.exit(1)
    }
  })

/**
 * Execute command - Phase 2
 */
program
  .command('execute')
  .description('Execute migration based on config')
  .argument('[feature]', 'Feature name to migrate')
  .option('-c, --config <path>', 'Path to config file')
  .option('--dry-run', 'Perform a dry run without modifying files')
  .action(async (featureName: string | undefined, options: { config?: string; dryRun?: boolean }) => {
    try {
      console.log(chalk.blue.bold('\n⚙️  Feature Migration Executor\n'))

      let config: FeatureConfig | null = null

      // Load config from file
      if (options.config) {
        config = loadAnalysisConfig(options.config)
        if (!config) {
          console.log(chalk.red(`\n❌ Failed to load config from: ${options.config}`))
          process.exit(1)
        }
      } else if (featureName) {
        // Try to load config from default location
        const configPath = path.join(process.cwd(), `.codemod/${featureName}.config.json`)
        if (fs.existsSync(configPath)) {
          config = loadAnalysisConfig(configPath)
        } else {
          console.log(chalk.yellow(`\n⚠️  No config found at: ${configPath}`))
          console.log(chalk.gray(`Run ${chalk.white(`migrate-feature analyze ${featureName}`)} first`))
          process.exit(1)
        }
      } else {
        console.log(chalk.red('\n❌ Please specify a feature name or config file'))
        process.exit(1)
      }

      if (!config) {
        console.log(chalk.red('\n❌ No valid config found'))
        process.exit(1)
      }

      // Confirm execution
      console.log(chalk.bold(`Feature: ${config.featureName}`))
      console.log(chalk.bold(`Public API:`))
      console.log(`  - ${config.publicAPI.components.length} component(s)`)
      console.log(`  - ${config.publicAPI.hooks.length} hook(s)`)
      console.log(`  - ${config.publicAPI.services.length} service(s)`)
      console.log(`  - ${config.consumers.length} consumer file(s) will be updated`)

      if (options.dryRun) {
        console.log(chalk.yellow('\n🔍 DRY RUN MODE - No files will be modified\n'))
      } else {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: chalk.bold('Proceed with migration?'),
            default: false,
          },
        ])

        if (!confirm) {
          console.log(chalk.gray('\nMigration cancelled'))
          process.exit(0)
        }
      }

      // Execute migration
      const result = await executeMigration(config, options.dryRun)

      if (result.success) {
        console.log(chalk.green.bold('\n✅ Migration completed successfully!\n'))
      } else {
        console.log(chalk.red.bold('\n❌ Migration completed with errors\n'))
        process.exit(1)
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error)
      process.exit(1)
    }
  })

/**
 * List command - Show all features
 */
program
  .command('list')
  .description('List all features and their migration status')
  .action(() => {
    console.log(chalk.blue.bold('\n📋 Features\n'))

    const features = getAllFeatures()

    const migrated: string[] = []
    const unmigrated: string[] = []

    for (const feature of features) {
      if (isFeatureMigrated(feature)) {
        migrated.push(feature)
      } else {
        unmigrated.push(feature)
      }
    }

    console.log(chalk.green.bold(`✓ Migrated (${migrated.length}):`))
    migrated.forEach((f) => console.log(chalk.green(`  - ${f}`)))

    console.log(chalk.yellow.bold(`\n⏳ Unmigrated (${unmigrated.length}):`))
    unmigrated.forEach((f) => console.log(chalk.yellow(`  - ${f}`)))

    console.log(
      chalk.gray(
        `\nTotal: ${features.length} features (${Math.round((migrated.length / features.length) * 100)}% migrated)\n`,
      ),
    )
  })

program.parse()
