/**
 * Auto-generated snapshot tests for Storybook stories
 * Run "yarn generate:storybook-tests" to regenerate
 */
import '../../../../../../apps/web/src/tests/storybook-setup'
import { composeStories } from '@storybook/react'
import { render } from '@testing-library/react'
import type { ComponentType } from 'react'

import * as stories from './Filters.stories'

const composedStories = composeStories(stories)

describe('./Filters.stories', () => {
  Object.entries(composedStories).forEach(([storyName, Story]) => {
    test(storyName, () => {
      const StoryComponent = Story as ComponentType
      const { container } = render(<StoryComponent />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
