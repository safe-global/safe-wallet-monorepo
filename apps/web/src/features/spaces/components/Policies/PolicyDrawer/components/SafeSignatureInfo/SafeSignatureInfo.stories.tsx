import type { Meta, StoryObj } from '@storybook/react'
import SafeSignatureInfo from './SafeSignatureInfo'

const meta = {
  title: 'Features/Spaces/Policies/PolicyDrawer/SafeSignatureInfo',
  component: SafeSignatureInfo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Ops', threshold: 3 },
    signatures: 2,
  },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafeSignatureInfo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoSignaturesYet: Story = {
  args: {
    signatures: 0,
  },
}

/** No address book entry — the shortened address stands in for the name. */
export const Unnamed: Story = {
  args: {
    safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', threshold: 2 },
    signatures: 1,
  },
}

export const CustomLabel: Story = {
  args: {
    label: 'Signing Safe account',
  },
}

/** Threshold reached — the progress badge flips from warning to success. */
export const ThresholdReached: Story = {
  args: {
    signatures: 3,
  },
}
