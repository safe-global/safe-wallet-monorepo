import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { createMockStory } from '@/stories/mocks'
import Messages from '@/pages/transactions/messages'

/**
 * Messages page - displays off-chain (EIP-1271) signed messages.
 * Shows signed messages and EIP-712 typed data grouped by date.
 */

const OWNER_1 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const OWNER_2 = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'
const sig = (n: string) => '0x' + n.repeat(130)
const hash = (n: string) => '0x' + n.repeat(64)

const messagesPage: MessagePage = {
  count: 3,
  next: null,
  previous: null,
  results: [
    { type: 'DATE_LABEL', timestamp: 1727270400000 },
    {
      type: 'MESSAGE',
      messageHash: hash('a'),
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
    },
    {
      type: 'MESSAGE',
      messageHash: hash('b'),
      status: 'NEEDS_CONFIRMATION',
      name: 'Blur',
      logoUri: null,
      message: 'Sign in to Blur\n\nNonce: 8f3c1a20-4c2e-4a5b-9e21-3d1f0a7c9b44',
      creationTimestamp: 1727184000000,
      modifiedTimestamp: 1727184000000,
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
      proposedBy: { value: OWNER_2 },
      confirmations: [{ owner: { value: OWNER_2 }, signature: sig('4') }],
      preparedSignature: null,
      origin: null,
    },
    { type: 'DATE_LABEL', timestamp: 1727011200000 },
    {
      type: 'MESSAGE',
      messageHash: hash('c'),
      status: 'CONFIRMED',
      name: null,
      logoUri: null,
      message: 'I am not the person operating this Safe account, but I am authorised to sign on its behalf.',
      creationTimestamp: 1727012000000,
      modifiedTimestamp: 1727013000000,
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
      proposedBy: { value: OWNER_1 },
      confirmations: [
        { owner: { value: OWNER_1 }, signature: sig('5') },
        { owner: { value: OWNER_2 }, signature: sig('6') },
      ],
      preparedSignature: sig('7'),
      origin: null,
    },
  ],
}

const messagesHandler = (page: MessagePage) =>
  http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/messages$/, () => HttpResponse.json(page))

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/messages',
})

const meta = {
  title: 'Pages/Core/Transactions/Messages',
  component: Messages,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
    msw: { handlers: [messagesHandler(messagesPage), ...defaultSetup.handlers] },
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Messages>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [messagesHandler({ count: 0, next: null, previous: null, results: [] }), ...defaultSetup.handlers],
    },
  },
}
