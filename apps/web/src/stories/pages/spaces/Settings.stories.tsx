import type { ComponentType } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory, type FeatureFlags } from '@/stories/mocks'
// The settings index page only client-redirects to /spaces/settings/general, which no-ops
// in Storybook — render the general settings page directly instead.
import SpaceSettings from '@/pages/spaces/settings/general'
import SpaceSettingsExperimental from '@/pages/spaces/settings/experimental'
import SpaceSettingsAccount from '@/pages/spaces/settings/account'
import SpaceSettingsAbout from '@/pages/spaces/settings/about'

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

const createSettingsPageStory = (pathname: string, Page: ComponentType, features?: FeatureFlags): Story => {
  const setup = createSettingsSetup(pathname, features)
  return { parameters: { ...setup.parameters }, decorators: [setup.decorator], render: () => <Page /> }
}

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

export const Experimental: Story = createSettingsPageStory('/spaces/settings/experimental', SpaceSettingsExperimental, {
  workspacesExperimentalFeatures: true,
  policyRecipientAllowlist: true,
})

/** The page is on but no chain offers the allowlist, so the section only shows its empty message. */
export const ExperimentalUnavailable: Story = createSettingsPageStory(
  '/spaces/settings/experimental',
  SpaceSettingsExperimental,
  { workspacesExperimentalFeatures: true },
)

export const Account: Story = createSettingsPageStory('/spaces/settings/account', SpaceSettingsAccount)

export const About: Story = createSettingsPageStory('/spaces/settings/about', SpaceSettingsAbout)
