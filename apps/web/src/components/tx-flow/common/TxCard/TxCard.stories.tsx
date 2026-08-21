import type { Meta, StoryObj } from '@storybook/react'
import TxCard from './index'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

/**
 * The card a transaction step renders into, plus its two structural slots.
 *
 * Both slots bleed out through the card's own inline padding, so a rule spans the full card width
 * and content stays aligned with the rest. Call sites never hand-roll a negative margin — which is
 * what left the previous `<Separator className="-mx-6" />` dividers short of the right-hand edge.
 */
const meta: Meta<typeof TxCard> = {
  title: 'Components/TxFlow/TxCard',
  component: TxCard,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="max-w-[672px]">{Story()}</div>],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/** The shape most steps use: content, then a footer whose own rule separates it. */
export const WithFooter: Story = {
  render: () => (
    <TxCard>
      <Typography>
        You&apos;re about to deploy this Safe account and will have to confirm the transaction with your connected
        wallet.
      </Typography>

      <TxCard.Footer>
        <Button size="submit">Activate</Button>
      </TxCard.Footer>
    </TxCard>
  ),
}

/** Both rules run edge to edge. Compare their ends against the card's rounded corners. */
export const WithDividers: Story = {
  render: () => (
    <TxCard>
      <Typography>Review the details below before continuing.</Typography>

      <TxCard.Divider />

      <Typography>Signers and threshold.</Typography>

      <TxCard.Divider />

      <Typography>Estimated network fee.</Typography>

      <TxCard.Footer>
        <Button size="submit">Continue</Button>
      </TxCard.Footer>
    </TxCard>
  ),
}

/**
 * `divided={false}` for the steps whose rule sits above other content — errors and warnings —
 * rather than directly above the buttons, so the rule isn't drawn twice.
 */
export const FooterWithoutItsOwnRule: Story = {
  render: () => (
    <TxCard>
      <Typography>Review the details below before continuing.</Typography>

      <TxCard.Divider className="mt-4" />

      <Typography variant="paragraph-small" color="muted" className="block">
        This transaction will be executed by your connected wallet.
      </Typography>

      <TxCard.Footer divided={false}>
        <Button size="submit">Continue</Button>
      </TxCard.Footer>
    </TxCard>
  ),
}

/** Two actions: they stack full-width below `lg` and sit in a row above it. */
export const FooterWithTwoActions: Story = {
  render: () => (
    <TxCard>
      <Typography>Replace this transaction, or reject it on-chain.</Typography>

      <TxCard.Footer>
        <Button variant="outline" size="submit">
          Back
        </Button>
        <Button size="submit">Confirm</Button>
      </TxCard.Footer>
    </TxCard>
  ),
}
