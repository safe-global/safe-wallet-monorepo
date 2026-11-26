/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types')

const DEPS_TO_CHECK = [
  'typescript',
  'react',
  'redux',
  'react-redux',
  '@reduxjs/toolkit',
  'eslint',
  'prettier',
  'jest',
  'jest-fixed-jsdom',
  'msw',
  'date-fns',
  '@ledgerhq/context-module',
  '@ledgerhq/device-management-kit',
  '@ledgerhq/device-signer-kit-ethereum',
  '@types/jest',
  '@types/react',
  '@types/react-dom',
  'storybook',
  '@emotion/react',
  '@emotion/styled',
  '@mui/material',
  '@mui/icons-material',
  '@safe-global/protocol-kit',
  '@safe-global/safe-apps-sdk',
  '@safe-global/safe-deployments',
  '@safe-global/safe-modules-deployments',
  '@cowprotocol/app-data',
  '@base-ui/react',
]

/**
 * Detect and report different versions of specified dependencies across workspaces
 *
 * @param {Context} context
 * @param {string[]} depsToCheck - Array of dependency names to check
 */
function detectInconsistentVersions({ Yarn }, depsToCheck = DEPS_TO_CHECK) {
  const inconsistentDeps = new Map()

  for (const depName of depsToCheck) {
    const depVersions = new Map()

    // Collect all dependencies of this type across workspaces
    for (const dependency of Yarn.dependencies({ ident: depName })) {
      if (dependency.type === `peerDependencies`) continue

      // Try different ways to get the workspace name
      let workspaceName = 'unknown'

      if (dependency.workspace) {
        workspaceName =
          dependency.workspace.manifest?.name ||
          dependency.workspace.locator?.name ||
          dependency.workspace.cwd?.split('/').pop() ||
          dependency.workspace.anchoredDescriptor?.name ||
          'root'
      } else {
        workspaceName = 'root'
      }

      const version = dependency.range

      if (!depVersions.has(version)) {
        depVersions.set(version, [])
      }
      depVersions.get(version).push({ workspaceName, dependency })
    }

    // Only report if there are inconsistencies
    if (depVersions.size > 1) {
      inconsistentDeps.set(depName, depVersions)
    } else if (depVersions.size === 1) {
      const [version, workspaces] = depVersions.entries().next().value
      console.log(`✅ ${depName} version ${version} is consistent across ${workspaces.length} workspace(s)`)
    }
  }

  // Report inconsistencies as constraint errors, so `yarn install` and `yarn constraints` fail
  if (inconsistentDeps.size > 0) {
    for (const [depName, versions] of inconsistentDeps.entries()) {
      const found = [...versions.entries()]
        .map(([version, entries]) => `${version} (${entries.map((entry) => entry.workspaceName).join(', ')})`)
        .join('; ')
      for (const entries of versions.values()) {
        for (const { dependency } of entries) {
          dependency.error(`${depName} must use one version range in every workspace; found ${found}`)
        }
      }
    }
  } else {
    console.log('\n✅ All specified dependencies have consistent versions across workspaces.\n')
  }
}

module.exports = defineConfig({
  constraints: async (ctx) => {
    detectInconsistentVersions(ctx)
  },
})
