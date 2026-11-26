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

const OWNED_SAFE = '0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01'
const STRANGER_SAFE = '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb'
const UNDEPLOYED_SAFE = '0xE5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f'

const ownersBySafe: Record<string, string[]> = {
  [OWNED_SAFE]: [WALLET],
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

const overviewsHandler = http.get(/\/v2\/safes$/, ({ request }) => {
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
})

const ALL_SAFES = [OWNED_SAFE, STRANGER_SAFE, UNDEPLOYED_SAFE]

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
      msw: { handlers: [spaceSafesHandler(addresses), overviewsHandler, ...setup.handlers] },
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

export const Send: Story = storyFor({ action: ESafeAction.Send, connected: true })

export const OnlyUndeployedSafes: Story = storyFor({
  action: ESafeAction.Send,
  connected: true,
  addresses: [UNDEPLOYED_SAFE],
})
