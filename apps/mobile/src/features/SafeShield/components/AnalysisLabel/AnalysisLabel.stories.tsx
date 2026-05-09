import type { Meta, StoryObj } from '@storybook/react'
import { AnalysisLabel } from './AnalysisLabel'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

const meta: Meta<typeof AnalysisLabel> = {
  title: 'SafeShield/AnalysisLabel',
  component: AnalysisLabel,
  argTypes: {
    severity: {
      control: 'select',
      options: [Severity.OK, Severity.CRITICAL, Severity.INFO, Severity.WARN],
    },
    label: {
      control: 'text',
    },
    highlighted: {
      control: 'boolean',
    },
  },
}

export default meta

type Story = StoryObj<typeof AnalysisLabel>

export const NoThreatsDetected: Story = {
  args: {
    label: 'No threats detected',
    severity: Severity.OK,
    highlighted: false,
  },
}

export const IssuesFoundHighlighted: Story = {
  args: {
    label: 'Issues found',
    severity: Severity.CRITICAL,
    highlighted: true,
  },
}

export const IssuesFound: Story = {
  args: {
    label: 'Issues found',
    severity: Severity.CRITICAL,
    highlighted: false,
  },
}

export const UnknownRecipient: Story = {
  args: {
    label: 'Unknown recipient',
    severity: Severity.INFO,
    highlighted: false,
  },
}

export const Warning: Story = {
  args: {
    label: 'Review details',
    severity: Severity.WARN,
    highlighted: false,
  },
}
