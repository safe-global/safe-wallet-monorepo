import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import ElevationRequiredDialog from './index'

const defaultSetup = createMockStory({
  features: { spaces: true, oidcAuth: true },
  pathname: '/spaces/members',
  query: { spaceId: '1' },
  shadcn: true,
  store: { elevation: { isRequired: true } },
})

const meta = {
  title: 'Features/OidcAuth/ElevationRequiredDialog',
  component: ElevationRequiredDialog,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'centered',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof ElevationRequiredDialog>

export default meta
type Story = StoryObj<typeof meta>

/** What an admin sees after CGW rejects a sensitive action with `403 elevation_required`. */
export const ElevationRequired: Story = {}
