import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { fn } from 'storybook/test'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import { createMockStory, createNonOwnerWallet } from '@/stories/mocks'
import AddProposer from './AddProposer'

const efSafe = safeFixtures.efSafe
const parentSafeAddress = efSafe.owners[1].value
const nestedOnlyOwner = { value: '0x1234567890123456789012345678901234567890', name: null, logoUri: null }
const nestedOnlyWallet = createNonOwnerWallet(efSafe.chainId, { address: nestedOnlyOwner.value })

const nestedSafeHandlers = (parentThreshold: number) => [
  http.get(/\/v1\/chains\/\d+\/owners\/0x[a-fA-F0-9]+\/safes$/, () =>
    HttpResponse.json({ safes: [parentSafeAddress] }),
  ),
  http.get(new RegExp(`/v1/chains/\\d+/safes/${parentSafeAddress}$`), () =>
    HttpResponse.json({
      ...efSafe,
      address: { value: parentSafeAddress, name: null, logoUri: null },
      threshold: parentThreshold,
      owners: [nestedOnlyOwner, ...efSafe.owners.slice(3, 5)],
    }),
  ),
]

const storySetup = (config: Parameters<typeof createMockStory>[0], handlers: ReturnType<typeof nestedSafeHandlers>) => {
  const setup = createMockStory({ scenario: 'efSafe', shadcn: true, pathname: '/settings/setup', ...config })
  return {
    parameters: { ...setup.parameters, msw: { handlers: [...handlers, ...setup.handlers] } },
    decorators: [setup.decorator],
  }
}

const meta = {
  title: 'Features/Proposers/AddProposer',
  component: AddProposer,
  args: {
    onClose: fn(),
    onSuccess: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AddProposer>

export default meta

type Story = StoryObj<typeof meta>

/** A signer of this Safe adds a proposer with their own wallet signature. */
export const Default: Story = storySetup({ wallet: 'owner' }, [])

/** A signer who also owns a parent Safe of this Safe chooses which account the proposer is created under. */
export const NestedSafeOwner: Story = storySetup({ wallet: 'owner' }, nestedSafeHandlers(1))

/** The wallet only reaches this Safe through a 2-of-3 parent Safe, so adding the proposer collects parent signatures first. */
export const NestedMultiSigOwner: Story = storySetup({ wallet: nestedOnlyWallet }, nestedSafeHandlers(2))
