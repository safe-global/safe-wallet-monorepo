import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import AllowlistConsent from './AllowlistConsent'
import { reviewConsentLabel } from './constants'

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/AllowlistConsent',
  component: AllowlistConsent,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: reviewConsentLabel('Payments', '3 minutes'),
    checked: false,
    showError: false,
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof AllowlistConsent>

export default meta
type Story = StoryObj<typeof meta>

export const Unticked: Story = {}

export const Ticked: Story = { args: { checked: true } }

export const ContinuedWithoutTicking: Story = { args: { showError: true } }
