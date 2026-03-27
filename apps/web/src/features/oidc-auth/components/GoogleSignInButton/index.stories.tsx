import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import GoogleSignInButton from './index'

const defaultSetup = createMockStory({
  features: { oidcAuth: true },
})

const meta = {
  title: 'Features/OidcAuth/GoogleSignInButton',
  component: GoogleSignInButton,
  loaders: [mswLoader],
  tags: ['autodocs'],
  parameters: { ...defaultSetup.parameters },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof GoogleSignInButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
