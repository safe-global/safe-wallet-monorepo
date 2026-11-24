import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { SAFE_ADDRESSES } from '@safe-global/test/msw/fixtures'
import { GATEWAY_URL } from '@/config/gateway'
import { createMockStory } from '@/stories/mocks/createMockStory'
import SpaceSafeBar from './index'

const { address, chainId } = SAFE_ADDRESSES.efSafe

// The locked bar builds its item from the Safe overview, which the default handlers don't serve
const overview = {
  address: { value: address },
  chainId,
  threshold: 1,
  owners: [
    { value: '0x0000000000000000000000000000000000000001' },
    { value: '0x0000000000000000000000000000000000000002' },
  ],
  fiatTotal: '1234.56',
  queued: 0,
  awaitingConfirmation: null,
}
const overviewHandlers = [
  http.get(`${GATEWAY_URL}/v2/safes`, () => HttpResponse.json([overview])),
  http.get(`${GATEWAY_URL}/v1/safes`, () => HttpResponse.json([overview])),
]

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'none',
  shadcn: true,
  handlers: overviewHandlers,
})

/** The topbar Safe bar during a Workspace tx flow: the flow's Safe, read-only. */
const meta = {
  title: 'Features/Spaces/SpaceSafeBar',
  component: SpaceSafeBar,
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceSafeBar>

export default meta
type Story = StoryObj<typeof meta>

export const LockedToFlowSafe: Story = {
  args: {
    lockedSafe: { chainId, safeAddress: address },
  },
}
