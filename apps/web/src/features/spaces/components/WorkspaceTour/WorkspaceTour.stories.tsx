import type { ComponentType } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse, type HttpHandler } from 'msw'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { createMockStory, MOCK_SPACE_ID } from '@/stories/mocks'
import { createChainData, createChainsPageData, createChainsPageDataV2 } from '@/stories/mocks/chains'
import { spaceWithSafesHandler } from '@/stories/mocks/handlers'
import { AppRoutes } from '@/config/routes'
import local from '@/services/local-storage/local'
import SpaceDashboardPage from '@/pages/spaces'
import SpaceSafeAccountsPage from '@/pages/spaces/safe-accounts'
import SpaceAddressBookPage from '@/pages/spaces/address-book'
import SpaceSettingsGeneralPage from '@/pages/spaces/settings/general'
import { WORKSPACE_TOUR_SEEN_KEY } from './hooks/useWorkspaceTourVisit'

const TREASURY_MULTISIG = '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2'

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

const WORKSPACE_CONTACTS = [
  workspaceContact('Treasury multisig', TREASURY_MULTISIG),
  workspaceContact('Payroll vendor', '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA'),
]

const LOCAL_CONTACTS = { '1': { [TREASURY_MULTISIG]: 'Treasury multisig' } }

const features = { spaceAuditLog: true, safeProAnnouncement: true }

const chain = createChainData(features)
chain.features = [...chain.features, FEATURES.WORKSPACES_ADDRESS_BOOK_V2, FEATURES.PRIVATE_ADDRESS_BOOK]

const chainHandlers = [
  http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chain)),
  http.get(/\/v1\/chains$/, () => HttpResponse.json(createChainsPageData(chain))),
  http.get(/\/v2\/chains$/, () => HttpResponse.json(createChainsPageDataV2(chain, features))),
]

const addressBookHandler = (contacts: typeof WORKSPACE_CONTACTS) =>
  http.get(/\/v1\/spaces\/[^/]+\/address-book$/, () =>
    HttpResponse.json({ spaceUuid: MOCK_SPACE_ID, data: contacts, tags: [] }),
  )

const noSafesHandler = http.get(/\/v1\/spaces\/[^/]+\/safes$/, () => HttpResponse.json({ safes: {} }))

const forgetTourVisits = () => {
  Object.keys(window.localStorage)
    .filter((key) => key.includes(WORKSPACE_TOUR_SEEN_KEY))
    .forEach((key) => window.localStorage.removeItem(key))
  local.setItem('safeProAnnouncementSeen', true)
  local.setItem('safeProSidebarBannerDismissed', true)
  return {}
}

type TourStoryOptions = {
  page: ComponentType
  pathname: string
  isEmpty?: boolean
}

const tourStory = ({ page: Page, pathname, isEmpty = false }: TourStoryOptions) => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'disconnected',
    layout: 'fullPage',
    pathname,
    authenticated: true,
    query: { spaceId: MOCK_SPACE_ID },
    shadcn: true,
    features,
    store: { addressBook: isEmpty ? {} : LOCAL_CONTACTS },
  })
  const dataHandlers: HttpHandler[] = isEmpty
    ? [noSafesHandler, addressBookHandler([])]
    : [spaceWithSafesHandler, addressBookHandler(WORKSPACE_CONTACTS)]

  return {
    render: () => <Page />,
    parameters: {
      ...setup.parameters,
      msw: { handlers: [...chainHandlers, ...dataHandlers, ...setup.handlers] },
    },
    decorators: [setup.decorator],
  } satisfies Story
}

const meta = {
  title: 'Features/Spaces/Workspace tour',
  parameters: { layout: 'fullscreen' },
  loaders: [forgetTourVisits],
  tags: ['skip-visual-test'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const OnDashboard: Story = tourStory({ page: SpaceDashboardPage, pathname: AppRoutes.spaces.index })

export const OnSafeAccounts: Story = tourStory({ page: SpaceSafeAccountsPage, pathname: AppRoutes.spaces.safeAccounts })

export const OnSafeAccountsWhenEmpty: Story = tourStory({
  page: SpaceSafeAccountsPage,
  pathname: AppRoutes.spaces.safeAccounts,
  isEmpty: true,
})

export const OnAddressBook: Story = tourStory({ page: SpaceAddressBookPage, pathname: AppRoutes.spaces.addressBook })

export const OnAddressBookWhenEmpty: Story = tourStory({
  page: SpaceAddressBookPage,
  pathname: AppRoutes.spaces.addressBook,
  isEmpty: true,
})

export const OnSettings: Story = tourStory({
  page: SpaceSettingsGeneralPage,
  pathname: AppRoutes.spaces.settingsGeneral,
})
