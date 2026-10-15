import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory, type FeatureFlags } from '@/stories/mocks'
// The settings index page only client-redirects to /spaces/settings/general, which no-ops
// in Storybook — render the general settings page directly instead.
import SpaceSettings from '@/pages/spaces/settings/general'
import SpaceSettingsExperimental from '@/pages/spaces/settings/experimental'

/**
 * Space Settings page - configure Space options.
 * Manage Space name, description, and preferences.
 */

const createSettingsSetup = (pathname: string, features: FeatureFlags = {}) =>
  createMockStory({
    scenario: 'efSafe',
    wallet: 'connected',
    layout: 'fullPage',
    pathname,
    features: { spaces: true, ...features },
    query: { spaceId: '1' },
  })

const meta = {
  title: 'Pages/Spaces/Settings',
  component: SpaceSettings,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SpaceSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = (() => {
  const setup = createSettingsSetup('/spaces/settings/general')
  return { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
})()

export const Experimental: Story = (() => {
  const setup = createSettingsSetup('/spaces/settings/experimental', { workspacesExperimentalFeatures: true })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
    render: () => <SpaceSettingsExperimental />,
  }
})()
