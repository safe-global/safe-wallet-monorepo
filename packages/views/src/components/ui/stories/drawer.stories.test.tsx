import '@/tests/storybook-setup'
import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'

import * as stories from './drawer.stories'

const { Open: OpenStory, Right: RightStory, AllVariants: AllVariantsStory } = composeStories(stories)

describe('UI/Drawer stories', () => {
  it('renders the open example without nested buttons', () => {
    const Open = OpenStory as ComponentType
    render(<Open />)

    expect(document.querySelectorAll('button button')).toHaveLength(0)
  })

  it('renders the right example as a dialog that slides from the right edge', () => {
    const Right = RightStory as ComponentType
    render(<Right />)

    expect(screen.getByRole('dialog', { name: 'Drawer title' })).toHaveAttribute('data-swipe-direction', 'right')
  })

  it('renders the variants example without nested buttons', () => {
    const AllVariants = AllVariantsStory as ComponentType
    render(<AllVariants />)

    expect(document.querySelectorAll('button button')).toHaveLength(0)
  })
})
