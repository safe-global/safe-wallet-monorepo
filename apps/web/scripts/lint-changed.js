#!/usr/bin/env node

import { execSync, spawn } from 'child_process'
import process from 'process'

/**
 * Lint changed TypeScript files using TypeScript compiler and Next.js linter in parallel
 */
async function lintChanged() {
  try {
    // Get TypeScript files that have changed but not yet staged
    const gitOutput = execSync('git diff --name-only --diff-filter=ACM', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to prevent noise
    }).trim()

    if (!gitOutput) {
      console.log('No changed files found')
      return
    }

    // Filter for TypeScript files in apps/web/
    const files = gitOutput
      .split('\n')
      .filter(file => /\.(ts|tsx)$/.test(file))
      .filter(file => file.startsWith('apps/web/'))
      .map(file => file.replace(/^apps\/web\//, ''))

    if (files.length === 0) {
      console.log('No TypeScript files changed to lint')
      return
    }

    console.log(`TypeScript files changed: ${files.join(' ')}`)

    // Run TypeScript check and Next.js lint in parallel
    const promises = [
      new Promise((resolve, reject) => {
        const tsc = spawn('yarn', ['tsc', '--noEmit'], { stdio: 'inherit' })
        tsc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`TypeScript check failed with code ${code}`)))
      }),
      new Promise((resolve, reject) => {
        const nextLint = spawn('npx', ['next', 'lint', '--file', ...files], { stdio: 'inherit' })
        nextLint.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Next.js lint failed with code ${code}`)))
      })
    ]

    await Promise.all(promises)
    console.log('✅ All linting checks passed')
    
  } catch (error) {
    console.error('❌ Linting failed:', error.message)
    process.exit(1)
  }
}

lintChanged()