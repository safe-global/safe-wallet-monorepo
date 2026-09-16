import type { Meta, StoryObj } from '@storybook/react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { StoreDecorator } from '@/stories/storeDecorator'
import ColorCodedTxAccordion from '.'

type TxInfo = TransactionDetails['txInfo']

const TX_INFO: Record<string, TxInfo> = {
  transfer: {
    type: 'Transfer',
    sender: { value: '0x1111111111111111111111111111111111111111', name: null, logoUri: null },
    recipient: { value: '0x2222222222222222222222222222222222222222', name: null, logoUri: null },
    direction: 'OUTGOING',
    transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000000' },
  },
  settingsChange: {
    type: 'SettingsChange',
    dataDecoded: { method: 'changeThreshold', parameters: null },
    settingsInfo: { type: 'CHANGE_THRESHOLD', threshold: 2 },
  },
  custom: {
    type: 'Custom',
    to: { value: '0x3333333333333333333333333333333333333333', name: null, logoUri: null },
    dataSize: '68',
    isCancellation: false,
  },
}

type HarnessProps = {
  level: keyof typeof TX_INFO
  defaultExpanded?: boolean
}

// The accordion reads dark mode off the settings slice, so it needs a store.
const Harness = ({ level, defaultExpanded }: HarnessProps) => (
  <StoreDecorator initialState={{}}>
    <div className="w-[32rem] p-4">
      <ColorCodedTxAccordion txInfo={TX_INFO[level]} defaultExpanded={defaultExpanded}>
        <div className="text-sm">Decoded call data goes here</div>
      </ColorCodedTxAccordion>
    </div>
  </StoreDecorator>
)

const meta: Meta<typeof Harness> = {
  title: 'Components/TxFlow/ColorCodedTxAccordion',
  component: Harness,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Collapsed, which is how the review step first shows it. The outline must be visible: #8040 painted
 * the border in the fill colour for every level, which made the block read as unbordered.
 */
export const Collapsed: Story = {
  args: { level: 'transfer' },
}

/** Open state, where the header row takes the tx-type tint and the border takes its accent. */
export const Expanded: Story = {
  args: { level: 'transfer', defaultExpanded: true },
}

/** Settings changes are the one warning-level tx type, and the only one with a yellow accent. */
export const SettingsChange: Story = {
  args: { level: 'settingsChange', defaultExpanded: true },
}

/** Everything the level map does not name falls back to info, and renders no method chip. */
export const Custom: Story = {
  args: { level: 'custom' },
}
