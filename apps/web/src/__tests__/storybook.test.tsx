import { describe, expect, test } from '@jest/globals'
import { composeStories } from '@storybook/react'
import { render } from '@testing-library/react'
import { globSync } from 'glob'
import path from 'path'
import type { ComponentType } from 'react'

/**
 * Automatically generates snapshot tests for all Storybook stories
 * This test file discovers all .stories.tsx files and creates snapshot tests for each story
 */

// Get all story files
const storyFiles = globSync(path.join(__dirname, '../**/*.stories.tsx'))

describe('Storybook Snapshots', () => {
  storyFiles.forEach((storyFilePath) => {
    // Get the relative path for better test names
    const relativePath = path.relative(path.join(__dirname, '..'), storyFilePath)

    describe(relativePath, () => {
      // Dynamically import each story file
       
      const storyModule = require(storyFilePath)

      // Compose all stories from the file
      const composedStories = composeStories(storyModule)

      // Create a test for each story
      Object.entries(composedStories).forEach(([storyName, Story]) => {
        test(storyName, () => {
          const StoryComponent = Story as ComponentType
          const { container } = render(<StoryComponent />)
          expect(container.firstChild).toMatchSnapshot()
        })
      })
    })
  })
})
