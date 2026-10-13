/**
 * Auto-generated snapshot tests for Storybook stories
 * Run "yarn generate:storybook-tests" to regenerate
 */
import '@/tests/storybook-setup'
import { composeStories } from '@storybook/react'
import { render } from '@testing-library/react'
import type { ComponentType } from 'react'

import * as stories from './button.stories'

const composedStories = composeStories(stories)

describe('./button.stories', () => {
  Object.entries(composedStories).forEach(([storyName, Story]) => {
    test(storyName, () => {
      const StoryComponent = Story as ComponentType
      const { container } = render(<StoryComponent />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
