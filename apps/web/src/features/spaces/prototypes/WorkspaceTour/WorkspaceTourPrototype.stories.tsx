import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { createMockStory, MOCK_SPACE_ID } from '@/stories/mocks'
import { createChainData, createChainsPageData, createChainsPageDataV2 } from '@/stories/mocks/chains'
import { spaceWithSafesHandler } from '@/stories/mocks/handlers'
import local from '@/services/local-storage/local'
import { WorkspaceTourPrototype } from './WorkspaceTourPrototype'

const TREASURY_MULTISIG = '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2'
const PERSONAL_LEDGER = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'
const TEST_WALLET = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'

const workspaceContact = (name: string, address: string) => ({
  name,
  address,
  chainIds: ['1'],
  tagIds: [],
  createdBy: 'Admin User',
  createdByUserId: 1,
  lastUpdatedBy: 'Admin User',
  lastUpdatedByUserId: 1,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
})

// Treasury multisig is also a local contact, so the Local contacts tab shows the "Already shared" badge.
const WORKSPACE_CONTACTS = [
  workspaceContact('Treasury multisig', TREASURY_MULTISIG),
  workspaceContact('Payroll vendor', '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA'),
  workspaceContact('Exchange deposit', '0x26C3f6fD4f53a03eC8e54Aca0c356112cA3DDEc8'),
]

// The announcement flag shows Plans without SAFE_PRO's plan check, whose lock modal would cover the tour.
const features = { spaceAuditLog: true, safeProAnnouncement: true }

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'fullPage',
  pathname: '/spaces',
  authenticated: true,
  query: { spaceId: MOCK_SPACE_ID },
  shadcn: true,
  features,
  store: {
    addressBook: {
      '1': {
        [TREASURY_MULTISIG]: 'Treasury multisig',
        [PERSONAL_LEDGER]: 'My Ledger',
        [TEST_WALLET]: 'Test wallet',
      },
    },
  },
})

// Every tab and address book list the tour points at must exist; these flags have no createMockStory switch.
const chain = createChainData(features)
chain.features = [
  ...chain.features,
  FEATURES.SPACE_TRANSACTIONS,
  FEATURES.POLICIES,
  FEATURES.SECURITY_HUB,
  FEATURES.WORKSPACES_ADDRESS_BOOK_V2,
  FEATURES.PRIVATE_ADDRESS_BOOK,
]
const allTabsChainHandlers = [
  http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chain)),
  http.get(/\/v1\/chains$/, () => HttpResponse.json(createChainsPageData(chain))),
  http.get(/\/v2\/chains$/, () => HttpResponse.json(createChainsPageDataV2(chain, features))),
  http.get(/\/v1\/spaces\/[^/]+\/address-book$/, () =>
    HttpResponse.json({ spaceUuid: MOCK_SPACE_ID, data: WORKSPACE_CONTACTS, tags: [] }),
  ),
]

const meta = {
  title: 'Features/Spaces/Prototypes/Workspace tour',
  component: WorkspaceTourPrototype,
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    msw: { handlers: [...allTabsChainHandlers, spaceWithSafesHandler, ...setup.handlers] },
  },
  decorators: [setup.decorator],
  // Mark the Safe Pro announcement modal and sidebar banner as seen so neither covers the tour.
  loaders: [
    () => {
      local.setItem('safeProAnnouncementSeen', true)
      local.setItem('safeProSidebarBannerDismissed', true)
      return {}
    },
  ],
  tags: ['skip-visual-test'],
} satisfies Meta<typeof WorkspaceTourPrototype>

export default meta
type Story = StoryObj<typeof meta>

export const FirstVisit: Story = {
  args: { startOpen: true },
}

export const OpenASafeStep: Story = {
  args: { startOpen: true, initialStepId: 'safe-row' },
}

export const LastStep: Story = {
  args: { startOpen: true, initialStepId: 'done' },
}

export const TourDismissed: Story = {
  args: { startOpen: false },
}
