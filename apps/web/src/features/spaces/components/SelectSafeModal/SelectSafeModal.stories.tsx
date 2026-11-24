import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { createNonOwnerWallet } from '@/stories/mocks/wallets'
import { MOCK_SPACE_ID } from '@/stories/mocks/ids'
import { ESafeAction } from '../../public/store/safeActionsModalSlice'
import SelectSafeModal from './index'

const CHAIN_ID = '1'
const WALLET = '0x1234567890123456789012345678901234567890'
const OTHER_OWNER = '0x9999999999999999999999999999999999999999'
const PARENT_SAFE = '0x8888888888888888888888888888888888888888'

const OWNED_SAFE = '0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01'
const PROPOSER_SAFE = '0xB63F3D0a4a7eFd1d0c08A9ef17C5e5d3DbBDE867'
const NESTED_SAFE = '0xC0ffee254729296a45a3885639AC7E10F9d54979'
const STRANGER_SAFE = '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb'
const UNDEPLOYED_SAFE = '0xE5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f'

const ownersBySafe: Record<string, string[]> = {
  [OWNED_SAFE]: [WALLET],
  [PROPOSER_SAFE]: [OTHER_OWNER],
  [NESTED_SAFE]: [PARENT_SAFE],
  [STRANGER_SAFE]: [OTHER_OWNER],
}

const undeployedSafes = {
  [CHAIN_ID]: {
    [UNDEPLOYED_SAFE]: {
      props: { safeAccountConfig: { owners: [WALLET], threshold: 1 } },
      status: { status: 'AWAITING_EXECUTION' },
    },
  },
}

const spaceSafesHandler = (addresses: string[]) =>
  http.get(/\/v1\/spaces\/[^/]+\/safes$/, () => HttpResponse.json({ safes: { [CHAIN_ID]: addresses } }))

const roleHandlers = [
  http.get(/\/v2\/safes$/, ({ request }) => {
    const ids = new URL(request.url).searchParams.get('safes')?.split(',') ?? []
    return HttpResponse.json(
      ids.map((id) => {
        const [chainId, address] = id.split(':')
        return {
          chainId,
          address: { value: address },
          owners: (ownersBySafe[address] ?? [OTHER_OWNER]).map((value) => ({ value })),
          threshold: 1,
          fiatTotal: '1250.5',
          queued: 0,
          awaitingConfirmation: null,
        }
      }),
    )
  }),
  http.get(/\/v[23]\/chains\/[^/]+\/delegates$/, () =>
    HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [{ safe: PROPOSER_SAFE, delegate: WALLET, delegator: OTHER_OWNER, label: 'Proposer' }],
    }),
  ),
  http.get(/\/v2\/owners\/[^/]+\/safes$/, () => HttpResponse.json({ [CHAIN_ID]: [PARENT_SAFE] })),
]

const ALL_SAFES = [OWNED_SAFE, PROPOSER_SAFE, NESTED_SAFE, STRANGER_SAFE, UNDEPLOYED_SAFE]

const storyFor = ({
  action,
  connected,
  addresses = ALL_SAFES,
}: {
  action: ESafeAction
  connected: boolean
  addresses?: string[]
}) => {
  const setup = createMockStory({
    authenticated: true,
    wallet: connected ? createNonOwnerWallet(CHAIN_ID, { address: WALLET }) : 'disconnected',
    pathname: '/spaces/transactions',
    query: { spaceId: MOCK_SPACE_ID },
    shadcn: true,
    store: {
      safeActionsModal: { opened: true, type: action },
      undeployedSafes,
    } as never,
  })
  // MSW is first-match-wins and createMockStory's defaults answer these routes too, so ours go first
  return {
    parameters: {
      ...setup.parameters,
      msw: { handlers: [spaceSafesHandler(addresses), ...roleHandlers, ...setup.handlers] },
    },
    decorators: [setup.decorator],
  }
}

const meta = {
  title: 'Features/Spaces/SelectSafeModal',
  component: SelectSafeModal,
} satisfies Meta<typeof SelectSafeModal>

export default meta
type Story = StoryObj<typeof meta>

export const NewTransaction: Story = storyFor({ action: ESafeAction.NewTransaction, connected: true })

export const NewTransactionNoWallet: Story = storyFor({ action: ESafeAction.NewTransaction, connected: false })

export const OnlyUndeployedSafes: Story = storyFor({
  action: ESafeAction.Send,
  connected: true,
  addresses: [UNDEPLOYED_SAFE],
})
