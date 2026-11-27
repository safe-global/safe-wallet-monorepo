import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import type { RecoveryQueueItem, RecoveryState } from '../../services/recovery-state'
import { RecoveryEvent, RecoveryTxType } from '../../services/recoveryEvents'
import recoveryStore, { type RecoveryContextType } from '../RecoveryContext'
import RecoveryListItem from '.'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
})

const DAY_IN_MS = 24 * 60 * 60 * 1_000
const DELAY_MODIFIER_ADDRESS = '0xd54895B1121A2eE3f37b502F507631FA1331BED6'

type QueueItemOptions = {
  validFrom: bigint
  expiresAt?: bigint | null
  queueNonce?: bigint
  isMalicious?: boolean
}

const createRecoveryQueueItem = ({
  validFrom,
  expiresAt = null,
  queueNonce = BigInt(0),
  isMalicious = false,
}: QueueItemOptions): RecoveryQueueItem =>
  ({
    address: DELAY_MODIFIER_ADDRESS,
    transactionHash: '0x6f465f9d996728a4c34e8fb0e767bb87f884f5901f26fa933f60a4d40b0bbe7d',
    timestamp: BigInt(Date.now() - DAY_IN_MS),
    validFrom,
    expiresAt,
    isMalicious,
    executor: '0x8b2f79E2A9e9C61c71E5EE9152dEA9A05b23e340',
    args: {
      queueNonce,
      txHash: '0x6f465f9d996728a4c34e8fb0e767bb87f884f5901f26fa933f60a4d40b0bbe7d',
      to: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
      value: BigInt(0),
      operation: BigInt(0),
      data: '0x',
    },
  }) as unknown as RecoveryQueueItem

const INITIAL_RECOVERY_STATE: RecoveryContextType = { state: [undefined, undefined, false], pending: {} }

const withRecoveryState = (recoveryState: Partial<RecoveryContextType>) => () => {
  recoveryStore.setStore({ ...INITIAL_RECOVERY_STATE, ...recoveryState })
  return () => recoveryStore.setStore(INITIAL_RECOVERY_STATE)
}

const pending = createRecoveryQueueItem({ validFrom: BigInt(Date.now() + 2 * DAY_IN_MS) })
const executable = createRecoveryQueueItem({ validFrom: BigInt(Date.now() - DAY_IN_MS) })
const expired = createRecoveryQueueItem({
  validFrom: BigInt(Date.now() - 2 * DAY_IN_MS),
  expiresAt: BigInt(Date.now() - DAY_IN_MS),
})
const notNext = createRecoveryQueueItem({ validFrom: BigInt(Date.now() - DAY_IN_MS), queueNonce: BigInt(1) })

const notNextRecoveryState: RecoveryState = [
  {
    address: DELAY_MODIFIER_ADDRESS,
    recoverers: [notNext.executor],
    expiry: BigInt(0),
    delay: BigInt(DAY_IN_MS),
    txNonce: BigInt(0),
    queueNonce: BigInt(2),
    queue: [notNext],
  },
]

const expandRow: Story['play'] = async ({ canvasElement }) => {
  const { userEvent, within } = await import('storybook/test')
  await userEvent.click(within(canvasElement).getByRole('button', { name: /Account recovery/ }))
}

/** The row sizes itself against its container, not the viewport, so each width is its own story. */
const atWidth = (width: number) =>
  function WidthDecorator(Story: () => React.ReactElement) {
    return (
      <div style={{ width }}>
        <Story />
      </div>
    )
  }

const meta = {
  title: 'Features/Recovery/RecoveryListItem',
  component: RecoveryListItem,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof RecoveryListItem>

export default meta

type Story = StoryObj<typeof meta>

export const Pending: Story = {
  args: { item: pending },
}

export const Executable: Story = {
  args: { item: executable },
}

export const Malicious: Story = {
  args: { item: createRecoveryQueueItem({ validFrom: BigInt(Date.now() + 2 * DAY_IN_MS), isMalicious: true }) },
}

export const Expired: Story = {
  args: { item: expired },
  play: expandRow,
}

/** Past its review window, but an earlier proposal must be executed or cancelled first. */
export const NotNext: Story = {
  args: { item: notNext },
  beforeEach: withRecoveryState({ state: [notNextRecoveryState, undefined, false] }),
  play: expandRow,
}

export const Processing: Story = {
  args: { item: executable },
  beforeEach: withRecoveryState({
    pending: { [executable.args.txHash]: { status: RecoveryEvent.PROCESSING, txType: RecoveryTxType.EXECUTION } },
  }),
}

/** Below 680px the row switches to a two-row template; the status chip must stay inside it. */
export const PendingTablet: Story = {
  args: { item: pending },
  decorators: [atWidth(600)],
}

export const ExecutableTablet: Story = {
  args: { item: executable },
  decorators: [atWidth(600)],
}

export const PendingPhone: Story = {
  args: { item: pending },
  decorators: [atWidth(360)],
}

export const ExecutablePhone: Story = {
  args: { item: executable },
  decorators: [atWidth(360)],
}
