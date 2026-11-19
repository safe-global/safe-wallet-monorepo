import { useEffect, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { useArgs } from 'storybook/preview-api'
import { http, HttpResponse } from 'msw'
import { getRouter } from '@storybook/nextjs/router.mock'
import { AppRoutes } from '@/config/routes'
import SpaceSafeAccounts from '@/pages/spaces/safe-accounts'
import { mockProposerDto, mockSpendingLimitDto } from '../../mocks/activePolicies'
import { createPoliciesM2Story } from '../m2Prototype'
import { PoliciesPage } from './policiesPage'
import { RestrictedSafePointer, type BannerPage } from '../restrictedSafeBanner/bannerIdeas'

const setup = createPoliciesM2Story({ wallet: 'owner', pathname: AppRoutes.spaces.safeAccounts })

const PAGE_ROUTES: Record<BannerPage, string> = {
  'safe-accounts': AppRoutes.spaces.safeAccounts,
  policies: AppRoutes.spaces.policies,
}

const getPath = (url: unknown): string | undefined =>
  typeof url === 'string' ? url : (url as { pathname?: string } | undefined)?.pathname

/** The production Safe accounts and Policies pages; the sidebar switches between them. */
const RestrictedSafePrototype = ({
  page,
  isTipDismissed,
  onNavigate,
  onDismissTip,
}: {
  page: BannerPage
  /** One Got it hides the popover on both pages until the story reloads. */
  isTipDismissed: boolean
  onNavigate: (page: BannerPage) => void
  onDismissTip: () => void
}): ReactElement => {
  useEffect(() => {
    const toPage = (path?: string) =>
      (Object.keys(PAGE_ROUTES) as BannerPage[]).find((key) => PAGE_ROUTES[key] === path?.split('?')[0])

    const router = getRouter()
    const original = router.push.getMockImplementation()
    router.push.mockImplementation((url: unknown) => {
      const nextPage = toPage(getPath(url))
      if (nextPage) onNavigate(nextPage)
      return Promise.resolve(true)
    })

    // Sidebar links are plain anchors in Storybook, so their clicks are caught here.
    const handleClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('[data-sidebar="sidebar"] a[href]') : null
      const nextPage = link
        ? toPage(new URL(link.getAttribute('href') ?? '', window.location.origin).pathname)
        : undefined
      if (!nextPage) return
      event.preventDefault()
      event.stopPropagation()
      onNavigate(nextPage)
    }
    document.addEventListener('click', handleClick, true)

    return () => {
      router.push.mockImplementation(original ?? (() => Promise.resolve(true)))
      document.removeEventListener('click', handleClick, true)
    }
  }, [onNavigate])

  // The sidebar reads the route from the mocked router to mark its active item.
  const router = getRouter()
  Object.assign(router, { pathname: PAGE_ROUTES[page], asPath: PAGE_ROUTES[page], route: PAGE_ROUTES[page] })

  return (
    <div className="[&_div:has(>table)]:pb-0! [&_tbody_tr:last-child_td]:border-b-4">
      {page === 'safe-accounts' ? <SpaceSafeAccounts /> : <PoliciesPage />}
      <RestrictedSafePointer
        key={page}
        page={page}
        idea="tooltip"
        isDismissed={isTipDismissed}
        onDismiss={onDismissTip}
      />
    </div>
  )
}

const meta = {
  title: 'Prototype/Policy engine/3 · Protected Safe accounts: allowlist built into new Safes',
  // A plain URL, since the title's · would end up in it.
  id: 'prototype-protected-safe-accounts',
  component: RestrictedSafePrototype,
  argTypes: {
    page: { control: 'inline-radio', options: ['safe-accounts', 'policies'] },
    isTipDismissed: { table: { disable: true } },
    onNavigate: { table: { disable: true } },
    onDismissTip: { table: { disable: true } },
  },
  // Storybook's own hook, so a sidebar click re-renders the whole shell and its active item moves.
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <RestrictedSafePrototype
        {...args}
        onNavigate={(page) => updateArgs({ page })}
        onDismissTip={() => updateArgs({ isTipDismissed: true })}
      />
    )
  },
} satisfies Meta<typeof RestrictedSafePrototype>

export default meta
type Story = StoryObj<typeof meta>

/** Popover on Add accounts and Add policy → create flow: account type → name → signers → allowlist → review. */
export const FullFlow: Story = {
  name: 'Full flow (18 Nov)',
  args: { page: 'safe-accounts', isTipDismissed: false, onNavigate: () => {}, onDismissTip: () => {} },
  parameters: {
    ...setup.parameters,
    msw: {
      handlers: [
        http.get(/\/v1\/spaces\/[^/]+\/policies\/active/, () =>
          HttpResponse.json([mockSpendingLimitDto(), mockProposerDto()]),
        ),
        http.get(/\/v1\/spaces\/[^/]+\/policies\/pending/, () => HttpResponse.json([])),
        ...setup.parameters.msw.handlers,
      ],
    },
  },
  decorators: [setup.decorator],
}
