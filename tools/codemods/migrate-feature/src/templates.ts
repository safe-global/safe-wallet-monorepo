/**
 * Templates for generating boilerplate files
 */

import type { FeatureConfig } from './types.js'
import { kebabToPascal } from './utils.js'

/**
 * Generate contract.ts content
 */
export function generateContractTemplate(config: FeatureConfig): string {
  const { featureName, publicAPI } = config
  const featureNamePascal = kebabToPascal(featureName)

  const lines: string[] = []

  lines.push(`/**`)
  lines.push(` * ${featureNamePascal} Feature Contract - v3 flat structure`)
  lines.push(` *`)
  lines.push(` * IMPORTANT: Hooks are NOT included in the contract.`)
  lines.push(` * Hooks are exported directly from index.ts (always loaded, not lazy).`)
  lines.push(` *`)
  lines.push(` * Naming conventions determine stub behavior:`)
  lines.push(` * - PascalCase → component (stub renders null)`)
  lines.push(` * - camelCase → service (undefined when not ready)`)
  lines.push(` */`)
  lines.push(``)

  // Type imports for components
  if (publicAPI.components.length > 0) {
    lines.push(`// Component imports`)
    for (const component of publicAPI.components) {
      lines.push(`import type ${component} from './components/${component}'`)
    }
    lines.push(``)
  }

  // Type imports for services
  if (publicAPI.services.length > 0) {
    lines.push(`// Service imports`)
    for (const service of publicAPI.services) {
      lines.push(`import type { ${service} } from './services/${service}'`)
    }
    lines.push(``)
  }

  // Interface definition
  lines.push(`/**`)
  lines.push(` * ${featureNamePascal} Feature Implementation - flat structure (NO hooks)`)
  lines.push(` * This is what gets loaded when handle.load() is called.`)
  lines.push(` * Hooks are exported directly from index.ts to avoid Rules of Hooks violations.`)
  lines.push(` */`)
  lines.push(`export interface ${featureNamePascal}Contract {`)

  // Components
  if (publicAPI.components.length > 0) {
    lines.push(`  // Components (PascalCase) - stub renders null`)
    for (const component of publicAPI.components) {
      lines.push(`  ${component}: typeof ${component}`)
    }
    if (publicAPI.services.length > 0) {
      lines.push(``)
    }
  }

  // Services
  if (publicAPI.services.length > 0) {
    lines.push(`  // Services (camelCase) - undefined when not ready`)
    for (const service of publicAPI.services) {
      lines.push(`  ${service}: typeof ${service}`)
    }
  }

  lines.push(`}`)
  lines.push(``)

  return lines.join('\n')
}

/**
 * Generate feature.ts content
 */
export function generateFeatureTemplate(config: FeatureConfig): string {
  const { featureName, publicAPI } = config
  const featureNamePascal = kebabToPascal(featureName)

  const lines: string[] = []

  lines.push(`/**`)
  lines.push(` * ${featureNamePascal} Feature Implementation - LAZY LOADED (v3 flat structure)`)
  lines.push(` *`)
  lines.push(` * This entire file is lazy-loaded via createFeatureHandle.`)
  lines.push(` * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).`)
  lines.push(` *`)
  lines.push(` * IMPORTANT: Hooks are NOT included here - they're exported from index.ts`)
  lines.push(` * to avoid Rules of Hooks violations (lazy-loading hooks changes hook count between renders).`)
  lines.push(` *`)
  lines.push(` * Loaded when:`)
  lines.push(` * 1. The feature flag is enabled`)
  lines.push(` * 2. A consumer calls useLoadFeature(${featureNamePascal}Feature)`)
  lines.push(` */`)
  lines.push(`import type { ${featureNamePascal}Contract } from './contract'`)
  lines.push(``)

  // Direct imports for components
  if (publicAPI.components.length > 0) {
    lines.push(`// Component imports`)
    for (const component of publicAPI.components) {
      lines.push(`import ${component} from './components/${component}'`)
    }
    lines.push(``)
  }

  // Direct imports for services
  if (publicAPI.services.length > 0) {
    lines.push(`// Service imports`)
    for (const service of publicAPI.services) {
      lines.push(`import { ${service} } from './services/${service}'`)
    }
    lines.push(``)
  }

  // Feature object
  lines.push(`// Flat structure - naming conventions determine stub behavior:`)
  lines.push(`// - PascalCase → component (stub renders null)`)
  lines.push(`// - camelCase → service (undefined when not ready)`)
  lines.push(`// NO hooks here - they're exported from index.ts`)
  lines.push(`const feature: ${featureNamePascal}Contract = {`)

  // Components
  if (publicAPI.components.length > 0) {
    lines.push(`  // Components`)
    for (const component of publicAPI.components) {
      lines.push(`  ${component},`)
    }
    if (publicAPI.services.length > 0) {
      lines.push(``)
    }
  }

  // Services
  if (publicAPI.services.length > 0) {
    lines.push(`  // Services`)
    for (const service of publicAPI.services) {
      lines.push(`  ${service},`)
    }
  }

  lines.push(`}`)
  lines.push(``)
  lines.push(`export default feature`)
  lines.push(``)

  return lines.join('\n')
}

/**
 * Generate index.ts content
 */
export function generateIndexTemplate(config: FeatureConfig): string {
  const { featureName, publicAPI } = config
  const featureNamePascal = kebabToPascal(featureName)

  const lines: string[] = []

  const hasHooks = publicAPI.hooks && publicAPI.hooks.length > 0

  lines.push(`/**`)
  lines.push(` * ${featureNamePascal} Feature - Public API`)
  lines.push(` *`)
  lines.push(` * This feature provides [brief description].`)
  lines.push(` *`)
  lines.push(` * ## Usage`)
  lines.push(` *`)
  lines.push(` * \`\`\`typescript`)
  lines.push(
    ` * import { ${featureNamePascal}Feature${hasHooks ? ', ' + publicAPI.hooks[0] : ''} } from '@/features/${featureName}'`,
  )
  lines.push(` * import { useLoadFeature } from '@/features/__core__'`)
  lines.push(` *`)
  lines.push(` * function MyComponent() {`)
  lines.push(` *   const feature = useLoadFeature(${featureNamePascal}Feature)`)
  if (hasHooks) {
    lines.push(` *   const data = ${publicAPI.hooks[0]}()  // Hooks imported directly, always safe`)
  }
  lines.push(` *`)
  lines.push(` *   // No null check needed - always returns an object`)
  lines.push(` *   // Components render null when not ready (proxy stub)`)
  lines.push(` *   return <feature.${publicAPI.components[0] || 'MyComponent'} />`)
  lines.push(` * }`)
  lines.push(` *`)
  lines.push(` * // For explicit loading/disabled states:`)
  lines.push(` * function MyComponentWithStates() {`)
  lines.push(` *   const feature = useLoadFeature(${featureNamePascal}Feature)`)
  lines.push(` *`)
  lines.push(` *   if (feature.$isLoading) return <Skeleton />`)
  lines.push(` *   if (feature.$isDisabled) return null`)
  lines.push(` *`)
  lines.push(` *   return <feature.${publicAPI.components[0] || 'MyComponent'} />`)
  lines.push(` * }`)
  lines.push(` * \`\`\``)
  lines.push(` *`)
  lines.push(` * Components and services are accessed via flat structure from useLoadFeature().`)
  lines.push(` * Hooks are exported directly (always loaded, not lazy) to avoid Rules of Hooks violations.`)
  lines.push(` *`)
  lines.push(` * Naming conventions determine stub behavior:`)
  lines.push(` * - PascalCase → component (stub renders null)`)
  lines.push(` * - camelCase → service (undefined when not ready)`)
  lines.push(` */`)
  lines.push(``)
  lines.push(`import { createFeatureHandle } from '@/features/__core__'`)
  lines.push(`import type { ${featureNamePascal}Contract } from './contract'`)
  lines.push(``)
  lines.push(`// Feature handle - uses semantic mapping`)
  lines.push(
    `export const ${featureNamePascal}Feature = createFeatureHandle<${featureNamePascal}Contract>('${featureName}')`,
  )
  lines.push(``)

  // Export contract type
  lines.push(`// Contract type (for type annotations if needed)`)
  lines.push(`export type { ${featureNamePascal}Contract } from './contract'`)
  lines.push(``)

  // Export hooks directly (always loaded, not lazy)
  if (hasHooks) {
    lines.push(`// Hooks exported directly (always loaded, not in contract)`)
    lines.push(`// Keep hooks lightweight - minimal imports, heavy logic in services if needed`)
    for (const hook of publicAPI.hooks) {
      lines.push(`export { ${hook} } from './hooks/${hook}'`)
    }
    lines.push(``)
  }

  // Export public types
  if (publicAPI.types && publicAPI.types.length > 0) {
    lines.push(`// Public types (compile-time only, no runtime cost)`)
    lines.push(`export type { ${publicAPI.types.join(', ')} } from './types'`)
    lines.push(``)
  }

  // Export constants
  if (publicAPI.constants && publicAPI.constants.length > 0) {
    lines.push(`// Lightweight constants`)
    lines.push(`export { ${publicAPI.constants.join(', ')} } from './constants'`)
    lines.push(``)
  }

  return lines.join('\n')
}
