/**
 * Core types for the feature migration codemod tool
 */

/**
 * Type of export based on naming conventions
 */
export type ExportType = 'component' | 'hook' | 'service' | 'type' | 'constant' | 'unknown'

/**
 * Information about a single export
 */
export interface ExportInfo {
  name: string
  type: ExportType
  filePath: string
  isDefault: boolean
}

/**
 * Public API configuration for a feature
 */
export interface PublicAPI {
  components: string[]
  hooks: string[]
  services: string[]
  types?: string[]
  constants?: string[]
}

/**
 * Current structure analysis of a feature
 */
export interface FeatureStructure {
  hasComponentsFolder: boolean
  hasHooksFolder: boolean
  hasServicesFolder: boolean
  hasStoreFolder: boolean
  hasUtilsFolder: boolean
  hasContextsFolder: boolean
  hasTypesFile: boolean
  hasConstantsFile: boolean
  hasReadme: boolean
}

/**
 * Information about a consumer of the feature
 */
export interface Consumer {
  filePath: string
  imports: ImportInfo[]
}

/**
 * Information about an import statement
 */
export interface ImportInfo {
  name: string
  type: ExportType
  importPath: string
  isDefault: boolean
  isTypeOnly: boolean
}

/**
 * Complete feature migration configuration
 */
export interface FeatureConfig {
  featureName: string
  featureFlag?: string
  publicAPI: PublicAPI
  structure: FeatureStructure
  consumers: Consumer[]
  skipFiles?: string[]
  customNotes?: string[]
}

/**
 * Analysis result from phase 1
 */
export interface AnalysisResult {
  config: FeatureConfig
  warnings: string[]
  suggestions: string[]
}

/**
 * Migration result from phase 2
 */
export interface MigrationResult {
  success: boolean
  filesCreated: string[]
  filesModified: string[]
  filesMoved: string[]
  errors: string[]
  warnings: string[]
}

/**
 * Options for the CLI
 */
export interface CliOptions {
  feature?: string
  interactive?: boolean
  analyze?: boolean
  execute?: boolean
  config?: string
  dryRun?: boolean
}
