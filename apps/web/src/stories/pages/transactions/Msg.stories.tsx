import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import type { Message, MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { createMockStory } from '@/stories/mocks'
import MsgDetail from '@/pages/transactions/msg'

/**
 * Message Detail page - displays a specific message.
 * Shows message content, signatures, and status.
 */

const OWNER_1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const OWNER_2 = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'
const sig = (n: string) => '0x' + n.repeat(130)
const MESSAGE_HASH = '0x' + 'a'.repeat(64)

const message: Message = {
  messageHash: MESSAGE_HASH,
  status: 'CONFIRMED',
  name: 'OpenSea',
  logoUri: null,
  message: `Welcome to OpenSea!\n\nClick to sign in and accept the OpenSea Terms of Service.\n\nWallet address:\n${OWNER_1}`,
  creationTimestamp: 1727270500000,
  modifiedTimestamp: 1727270600000,
  confirmationsSubmitted: 2,
  confirmationsRequired: 2,
  proposedBy: { value: OWNER_1 },
  confirmations: [
    { owner: { value: OWNER_1 }, signature: sig('1') },
    { owner: { value: OWNER_2 }, signature: sig('2') },
  ],
  preparedSignature: sig('3'),
  origin: '{"url":"https://opensea.io","name":"OpenSea"}',
}

// The detail page resolves the message by hash. `useSafeMessage` reads it from the messages list
// (context store) and via a direct by-hash fetch, so both endpoints are mocked to the same message.
const messagesListHandler = http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/messages$/, () =>
  HttpResponse.json({
    count: 1,
    next: null,
    previous: null,
    results: [{ type: 'MESSAGE', ...message }],
  } satisfies MessagePage),
)

const messageByHashHandler = http.get(/\/v1\/chains\/\d+\/messages\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(message))

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/msg',
  query: { messageHash: MESSAGE_HASH },
})

const meta = {
  title: 'Pages/Core/Transactions/MessageDetail',
  component: MsgDetail,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
    msw: { handlers: [messagesListHandler, messageByHashHandler, ...defaultSetup.handlers] },
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof MsgDetail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
