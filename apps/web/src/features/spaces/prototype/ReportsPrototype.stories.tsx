import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'

import { ReportsPrototype } from './ReportsPrototype'

const meta = {
  title: 'Design System/Prototypes/Reports',
  component: ReportsPrototype,
  parameters: { layout: 'fullscreen' },
  args: { scenario: 'active', isAdmin: true, onChoosePlan: fn(), onUnavailableAction: fn() },
  argTypes: {
    scenario: {
      control: 'select',
      options: [
        'active',
        'trialEnding',
        'unreadableSafe',
        'exportFails',
        'exportLimitReached',
        'noSafeAccounts',
        'locked',
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[var(--color-background-main)] p-8 md:px-14">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReportsPrototype>

export default meta
type Story = StoryObj<typeof meta>

/** A paid Workspace: the current total, the last 6 month ends, and an export per row. */
export const Default: Story = {}

/** The trial ends this month. Admins get the "Choose a plan" action. */
export const TrialEnding: Story = { args: { scenario: 'trialEnding' } }

/** Members see the same notice without the action. */
export const TrialEndingMember: Story = { args: { scenario: 'trialEnding', isAdmin: false } }

/** One Safe account could not be read, so the current total is incomplete and has no change. */
export const SafeAccountUnreadable: Story = { args: { scenario: 'unreadableSafe' } }

/** Click "Export CSV" to see the error. */
export const ExportFails: Story = { args: { scenario: 'exportFails' } }

/** Click "Export CSV" to see the limit message. */
export const ExportLimitReached: Story = { args: { scenario: 'exportLimitReached' } }

export const NoSafeAccounts: Story = { args: { scenario: 'noSafeAccounts' } }

export const NoSafeAccountsMember: Story = { args: { scenario: 'noSafeAccounts', isAdmin: false } }

export const LockedWorkspace: Story = { args: { scenario: 'locked' } }

export const LockedWorkspaceMember: Story = { args: { scenario: 'locked', isAdmin: false } }
