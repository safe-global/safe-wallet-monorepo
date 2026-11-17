import type { Meta, StoryObj } from '@storybook/react'
import { CircleCheckIcon, CircleAlertIcon, InfoIcon } from 'lucide-react'
import { withMockProvider } from '@/storybook/decorators'
import CosignerCheckRow from './index'

const meta = {
  title: 'Features/PolicyCosigner/CosignerCheckRow',
  component: CosignerCheckRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof CosignerCheckRow>

export default meta
type Story = StoryObj<typeof meta>

export const SignatureAvailable: Story = {
  args: {
    icon: <CircleCheckIcon className="size-4 text-[var(--color-success-main)]" />,
    status: 'Signature available',
    description: 'The co-signer approved this transaction.',
    details: [{ label: 'Co-signer', value: '0x8675309C8E2B3a8b5aB8E0A8b5aB8E0A8b5aB8E0' }],
    state: 'ready',
    defaultOpen: true,
  },
}

export const Waiting: Story = {
  args: {
    icon: <InfoIcon className="size-4 text-[var(--color-info-main)]" />,
    status: 'Waiting for the co-signer',
    description: 'Waiting for the co-signer to review this transaction.',
    state: 'pending',
  },
}

export const Rejected: Story = {
  args: {
    icon: <CircleAlertIcon className="size-4 text-[var(--color-error-main)]" />,
    status: 'Rejected',
    description: 'The co-signer rejected this transaction: Recipient is not allowlisted',
    details: [{ label: 'Rule', value: 'rule_a1b2c3d4' }],
    state: 'rejected',
    defaultOpen: true,
  },
}
