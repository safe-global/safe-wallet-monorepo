import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Home from '@/pages/home'

/**
 * Home page - renders the Dashboard component.
 * This is the main entry point for logged-in users with a Safe.
 */

const meta = {
  title: 'Pages/Core/Home',
  component: Home,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    chromatic: {
      modes: {
        'light-desktop': { theme: 'light', viewport: { width: 1280, height: 800 } },
        'dark-desktop': { theme: 'dark', viewport: { width: 1280, height: 800 } },
      },
    },
  },
} satisfies Meta<typeof Home>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = (() => {
  const setup = createMockStory({
    scenario: 'safeTokenHolder',
    wallet: 'owner',
    layout: 'fullPage',
    pathname: '/home',
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

export const Empty: Story = (() => {
  const setup = createMockStory({
    scenario: 'empty',
    wallet: 'owner',
    layout: 'fullPage',
    pathname: '/home',
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
