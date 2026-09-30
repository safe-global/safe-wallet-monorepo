import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@/components/ui/typography'
import SignatureIcon from '@/public/images/transactions/signature.svg'
import TxSectionTitle from './index'

const meta = {
  title: 'Components/TxFlow/TxSectionTitle',
  component: TxSectionTitle,
} satisfies Meta<typeof TxSectionTitle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Note' },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <SignatureIcon className="size-4" />
        Sign with
      </>
    ),
  },
}

/** Against the step subtitle (`h4`) it sits under, so the hierarchy is visible. */
export const InHierarchy: Story = {
  args: { children: 'Note' },
  render: () => (
    <div className="flex flex-col gap-2">
      <Typography variant="h4" className="font-bold">
        Send tokens
      </Typography>
      <TxSectionTitle>Note</TxSectionTitle>
      <Typography variant="paragraph-small" color="muted">
        Notes are publicly visible. Do not share any private or sensitive details.
      </Typography>
    </div>
  ),
}
