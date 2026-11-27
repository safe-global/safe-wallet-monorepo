import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { expect, userEvent, within } from 'storybook/test'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { getFixtureData } from '@/stories/mocks/handlers'
import SignersTooltip from '.'

const { safeData } = getFixtureData('efSafe')
const you = safeData.owners[0]

const ana: AddressInfo = { value: '0x1F2a3b4C5d6E7f8091A2b3C4d5E6f708192A3b4C', name: 'Ana' }
const max: AddressInfo = { value: '0x2A3b4C5d6E7f8091A2b3C4d5E6f708192A3b4C5D', name: 'Max' }
const jonas: AddressInfo = { value: '0x3B4c5D6e7F8091a2B3c4D5e6F708192a3B4c5D6E', name: 'Jonas' }
const lena: AddressInfo = { value: '0x4C5d6E7f8091A2b3C4d5E6f708192A3b4C5d6E7F', name: 'Lena' }

const txDetailsHandler = (confirmed: AddressInfo[]) =>
  http.get(/\/v1\/chains\/\d+\/transactions\/[^/]+$/, () =>
    HttpResponse.json({
      txId: 'multisig_0x123_0xabc',
      txStatus: 'AWAITING_CONFIRMATIONS',
      txInfo: { type: 'Custom', to: { value: ana.value }, dataSize: '0', value: '0', isCancellation: false },
      detailedExecutionInfo: {
        type: 'MULTISIG',
        signers: [ana, max, you, jonas, lena],
        confirmationsRequired: 3,
        confirmations: confirmed.map((signer) => ({ signer, signature: '0x', submittedAt: 1_700_000_000_000 })),
      },
    }),
  )

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const meta = {
  title: 'Features/Spaces/Transactions/SignersTooltip',
  component: SignersTooltip,
  args: {
    chainId: safeData.chainId,
    txId: 'multisig_0x123_0xabc',
    safeAddress: safeData.address.value,
    status: 'waiting',
    nonce: 12,
    nextNonce: 12,
    submitted: 2,
    required: 3,
  },
  parameters: { layout: 'centered', ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof SignersTooltip>

export default meta
type Story = StoryObj<typeof meta>

const openTooltip = async (header: string) => {
  const screen = within(document.body)
  await userEvent.hover(screen.getByRole('button'))
  await expect(await screen.findByText(header)).toBeInTheDocument()
}

/** The connected wallet still has to sign: green, the user first in the list */
export const ReadyToSign: Story = {
  args: { status: 'sign' },
  parameters: { msw: { handlers: [txDetailsHandler([ana, max]), ...setup.handlers] } },
  play: () => openTooltip('2 of 3 signed · 1 more from 3 signers'),
}

export const ReadyToExecute: Story = {
  args: { status: 'execute', submitted: 3 },
  parameters: { msw: { handlers: [txDetailsHandler([ana, max, you]), ...setup.handlers] } },
  play: () => openTooltip('3 of 3 signed · threshold met'),
}

/** The user signed: amber, waiting on the others */
export const Signing: Story = {
  args: { status: 'waiting' },
  parameters: { msw: { handlers: [txDetailsHandler([ana, you]), ...setup.handlers] } },
  play: () => openTooltip('2 of 3 signed · 1 more from 3 signers'),
}

export const Blocked: Story = {
  args: { status: 'blocked', submitted: 3, nonce: 13 },
  parameters: { msw: { handlers: [txDetailsHandler([ana, max, you]), ...setup.handlers] } },
  play: () => openTooltip('Blocked by #12'),
}
