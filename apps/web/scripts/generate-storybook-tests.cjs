#!/usr/bin/env node
/**
 * Generates individual snapshot test files for each Storybook story file.
 * This creates colocated test files (*.stories.test.tsx) next to each story file,
 * resulting in separate snapshot files per component.
 *
 * Usage: node scripts/generate-storybook-tests.cjs
 */

const { globSync } = require('glob')
const fs = require('fs')
const path = require('path')

const SRC_DIR = path.join(__dirname, '../src')

// Find all story files
const storyFiles = globSync(path.join(SRC_DIR, '**/*.stories.tsx'))

const testTemplate = (storyImportPath, setupImportPath) => `/**
 * Auto-generated snapshot tests for Storybook stories
 * Run "yarn generate:storybook-tests" to regenerate
 */
import '${setupImportPath}'
import { composeStories } from '@storybook/react'
import { render } from '@testing-library/react'
import type { ComponentType } from 'react'

import * as stories from '${storyImportPath}'

const composedStories = composeStories(stories)

describe('${storyImportPath}', () => {
  Object.entries(composedStories).forEach(([storyName, Story]) => {
    test(storyName, () => {
      const StoryComponent = Story as ComponentType
      const { container } = render(<StoryComponent />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
`

let generated = 0
let skipped = 0

const SETUP_FILE = path.join(SRC_DIR, 'tests/storybook-setup')

storyFiles.forEach((storyFilePath) => {
  const testFilePath = storyFilePath.replace('.stories.tsx', '.stories.test.tsx')
  const testFileDir = path.dirname(testFilePath)
  const storyImportPath = './' + path.basename(storyFilePath).replace('.tsx', '')

  // Calculate relative path from test file to setup file
  const setupImportPath = path.relative(testFileDir, SETUP_FILE).replace(/\\/g, '/')

  // Skip if test file already exists and wasn't auto-generated
  if (fs.existsSync(testFilePath)) {
    const content = fs.readFileSync(testFilePath, 'utf-8')
    if (!content.includes('Auto-generated snapshot tests')) {
      console.log(`Skipping ${path.relative(SRC_DIR, testFilePath)} (manually created)`)
      skipped++
      return
    }
  }

  fs.writeFileSync(testFilePath, testTemplate(storyImportPath, setupImportPath))
  console.log(`Generated ${path.relative(SRC_DIR, testFilePath)}`)
  generated++
})

console.log(`\nDone! Generated ${generated} test files, skipped ${skipped}`)
