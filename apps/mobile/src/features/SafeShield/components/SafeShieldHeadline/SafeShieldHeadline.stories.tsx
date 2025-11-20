import type { Meta, StoryObj } from '@storybook/react'
import { SafeShieldHeadline } from './SafeShieldHeadline'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

const meta: Meta<typeof SafeShieldHeadline> = {
  title: 'SafeShield/SafeShieldHeadline',
  component: SafeShieldHeadline,
  argTypes: {
    type: {
      control: 'select',
      options: [Severity.OK, Severity.CRITICAL, Severity.INFO, Severity.WARN],
    },
  },
}

export default meta

type Story = StoryObj<typeof SafeShieldHeadline>

export const ChecksPassed: Story = {
  args: {
    type: Severity.OK,
  },
}

export const ChecksFailed: Story = {
  args: {
    type: Severity.CRITICAL,
  },
}

export const ReviewDetails: Story = {
  args: {
    type: Severity.INFO,
  },
}

export const IssuesFound: Story = {
  args: {
    type: Severity.WARN,
  },
}
