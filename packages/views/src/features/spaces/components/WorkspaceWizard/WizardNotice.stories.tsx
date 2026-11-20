import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import WizardNotice from './WizardNotice'

const meta = {
  title: 'Features/Spaces/WorkspaceWizard/WizardNotice',
  component: WizardNotice,
  parameters: { layout: 'padded' },
  args: {
    onPrimary: fn(),
    onSecondary: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[640px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WizardNotice>

export default meta
type Story = StoryObj<typeof meta>

export const WithBodyAndTwoButtons: Story = {
  args: {
    title: 'Continue where you left off?',
    body: 'Treasury Ops · Business 5 · 2 Safes · 1 invite',
    primaryLabel: 'Continue',
    secondaryLabel: 'Start over',
  },
}

export const WithoutBody: Story = {
  args: {
    title: 'You have not finished setting up Treasury Ops',
    primaryLabel: 'Finish setup',
    secondaryLabel: 'Create a new Workspace',
  },
}

export const OneButton: Story = {
  args: {
    title: 'Continue where you left off?',
    body: 'Treasury Ops · 2 Safes',
    primaryLabel: 'Continue',
  },
}
