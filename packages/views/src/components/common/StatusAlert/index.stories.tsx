import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button } from '@safe-global/views/components/ui/button'
import StatusAlert, { type StatusAlertTone } from './index'

const TONES: StatusAlertTone[] = ['info', 'success', 'warning', 'error', 'loading']

const meta = {
  title: 'Components/Common/StatusAlert',
  component: StatusAlert,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: TONES },
  },
  args: {
    tone: 'info',
    title: 'You are about to grant the ability to propose transactions.',
    description: 'To complete the setup, confirm with a signature from your connected wallet.',
  },
} satisfies Meta<typeof StatusAlert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {}

export const Success: Story = {
  args: { tone: 'success', title: 'Guard installed', description: 'The allowlist is now enforced on this Safe.' },
}

export const Warning: Story = {
  args: {
    tone: 'warning',
    title: 'No eligible Safe accounts',
    description: 'Only Safe accounts where you are a signer can get this policy.',
  },
}

export const ErrorWithRetry: Story = {
  args: {
    tone: 'error',
    title: undefined,
    description: 'Failed to load tokens.',
    action: (
      <Button type="button" variant="outline" size="sm">
        Retry
      </Button>
    ),
  },
}

export const Loading: Story = {
  args: { tone: 'loading', title: 'Checking guards on Main Safe…', description: undefined },
}

export const Dismissible: Story = {
  args: { onDismiss: fn() },
}

export const TitleOnly: Story = {
  args: { description: undefined },
}

export const AllTones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {TONES.map((tone) => (
        <StatusAlert key={tone} {...args} tone={tone} title={`${tone[0].toUpperCase()}${tone.slice(1)} title`} />
      ))}
    </div>
  ),
}
