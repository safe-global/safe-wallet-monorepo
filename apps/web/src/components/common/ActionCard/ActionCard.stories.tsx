import type { Meta, StoryObj } from '@storybook/react'
import { ActionCard } from '.'
import { Countdown } from '@/components/common/Countdown'

const meta = {
  title: 'Common/ActionCard',
  component: ActionCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ActionCard>

export default meta
type Story = StoryObj<typeof meta>

export const InfoSeverity: Story = {
  args: {
    severity: 'info',
    title: 'Information',
    content: 'This is an informational message to keep you updated.',
    actions: [{ label: 'Learn More', onClick: () => alert('Learn More clicked') }],
  },
}

export const WarningSeverity: Story = {
  args: {
    severity: 'warning',
    title: 'Warning',
    content: 'Please review this carefully before proceeding.',
    actions: [{ label: 'Review', onClick: () => alert('Review clicked') }],
  },
}

export const CriticalSeverity: Story = {
  args: {
    severity: 'critical',
    title: 'Critical Issue',
    content: 'Immediate action required to resolve this issue.',
    actions: [{ label: 'Fix Now', onClick: () => alert('Fix Now clicked') }],
  },
}

export const MultipleActions: Story = {
  args: {
    severity: 'warning',
    title: 'Setup Required',
    content: 'You need to configure your recovery setup.',
    actions: [
      { label: 'Migrate', onClick: () => alert('Migrate clicked') },
      { label: 'Get CLI', href: 'https://github.com/5afe/safe-cli', target: '_blank', rel: 'noopener noreferrer' },
    ],
  },
}

export const WithCountdown: Story = {
  args: {
    severity: 'info',
    title: 'Recovery In Progress',
    content: (
      <>
        <div style={{ marginBottom: '8px' }}>
          The recovery process has started. This Account will be ready to recover in:
        </div>
        <Countdown seconds={3600} />
      </>
    ),
    actions: [{ label: 'Go to queue', onClick: () => alert('Go to queue clicked') }],
  },
}

export const NoActions: Story = {
  args: {
    severity: 'info',
    title: 'Informational Only',
    content: 'This is just displaying information without any actions.',
  },
}

export const NoContent: Story = {
  args: {
    severity: 'warning',
    title: 'Simple Action Card',
    actions: [{ label: 'Continue', onClick: () => alert('Continue clicked') }],
  },
}

export const LongContent: Story = {
  args: {
    severity: 'warning',
    title: 'Base contract is not supported',
    content:
      "Your Safe Account's base contract is not in the list of officially supported deployments, but its bytecode matches a supported L2 contract (v1.3.0). You can migrate it to the corresponding official deployment to ensure full compatibility and support.",
    actions: [
      { label: 'Migrate', onClick: () => alert('Migrate clicked') },
      { label: 'Learn More', onClick: () => alert('Learn More clicked') },
    ],
  },
}
