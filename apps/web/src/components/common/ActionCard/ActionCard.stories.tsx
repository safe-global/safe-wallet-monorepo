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
    action: { label: 'Learn More', onClick: () => alert('Learn More clicked') },
  },
}

export const WarningSeverity: Story = {
  args: {
    severity: 'warning',
    title: 'Warning',
    content: 'Please review this carefully before proceeding.',
    action: { label: 'Review', onClick: () => alert('Review clicked') },
  },
}

export const CriticalSeverity: Story = {
  args: {
    severity: 'critical',
    title: 'Critical Issue',
    content: 'Immediate action required to resolve this issue.',
    action: { label: 'Fix Now', onClick: () => alert('Fix Now clicked') },
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
    action: { label: 'Go to queue', onClick: () => alert('Go to queue clicked') },
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
    action: { label: 'Continue', onClick: () => alert('Continue clicked') },
  },
}

export const LongContent: Story = {
  args: {
    severity: 'warning',
    title: 'Base contract is not supported',
    content:
      "Your Safe Account's base contract is not in the list of officially supported deployments, but its bytecode matches a supported L2 contract (v1.3.0). You can migrate it to the corresponding official deployment to ensure full compatibility and support.",
    action: { label: 'Migrate', onClick: () => alert('Migrate clicked') },
  },
}

export const WithTracking: Story = {
  args: {
    severity: 'info',
    title: 'Card with Analytics',
    content: 'This card tracks button clicks to Mixpanel. Check the console for tracking events.',
    action: {
      label: 'Track Me',
      onClick: () => console.log('Button clicked!'),
    },
    trackingEvent: {
      action: 'Example tracked action',
      category: 'storybook',
    },
  },
}
