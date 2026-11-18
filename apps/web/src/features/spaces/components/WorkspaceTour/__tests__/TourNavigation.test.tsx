import { useState } from 'react'
import type { NextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { AppRoutes } from '@/config/routes'
import { act, render, screen } from '@/tests/test-utils'
import { TOUR_STEPS } from '../constants'
import { ANCHOR_TIMEOUT_MS } from '../hooks/useAnchorElement'
import TourStop from '../TourStop'

const WORKSPACE_CONTACTS_STEP = TOUR_STEPS.find(({ id }) => id === 'workspace-contacts')!
const SLOWER_THAN_ANCHOR_WAIT_MS = ANCHOR_TIMEOUT_MS + 2000

jest.mock('../../../public/hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => '1' }))

const AddressBookPage = () => (
  <main>
    <Tabs defaultValue="workspace">
      <TabsList>
        <TabsTrigger value="workspace" data-testid="address-book-workspace-tab">
          Workspace contacts
        </TabsTrigger>
        <TabsTrigger value="mine" data-testid="address-book-local-tab">
          Local contacts
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </main>
)

type AppProps = {
  pageLoadMs: number
  push: jest.Mock
  onMissingAnchor: jest.Mock
  renderCount?: number
}

const AppStartingOnSafeAccounts = ({ pageLoadMs, push, onMissingAnchor }: AppProps) => {
  const [pathname, setPathname] = useState<string>(AppRoutes.spaces.safeAccounts)
  const router = {
    pathname,
    query: { spaceId: '1' },
    isReady: true,
    push: (url: { pathname: string }) => {
      push(url)
      setTimeout(() => setPathname(url.pathname), pageLoadMs)
      return Promise.resolve(true)
    },
  } as unknown as NextRouter

  return (
    <RouterContext.Provider value={router}>
      {pathname === AppRoutes.spaces.addressBook && <AddressBookPage />}
      <TourStop
        step={WORKSPACE_CONTACTS_STEP}
        progress={{ current: 5, total: 7 }}
        onBack={jest.fn()}
        onNext={jest.fn()}
        onClose={jest.fn()}
        onMissingAnchor={onMissingAnchor}
      />
    </RouterContext.Provider>
  )
}

describe('TourStop across a page change', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows the stop once its page loads, even when loading takes longer than the anchor wait', async () => {
    const onMissingAnchor = jest.fn()
    render(
      <AppStartingOnSafeAccounts
        pageLoadMs={SLOWER_THAN_ANCHOR_WAIT_MS}
        push={jest.fn()}
        onMissingAnchor={onMissingAnchor}
      />,
    )

    await act(async () => jest.advanceTimersByTime(SLOWER_THAN_ANCHOR_WAIT_MS))
    await act(async () => jest.advanceTimersByTime(100))

    expect(onMissingAnchor).not.toHaveBeenCalled()
    expect(screen.getByText('Address book entries everyone in the workspace can see.')).toBeInTheDocument()
  })

  it('navigates to the stop page only once while that page is loading', async () => {
    const push = jest.fn()
    const props = { pageLoadMs: SLOWER_THAN_ANCHOR_WAIT_MS, push, onMissingAnchor: jest.fn() }
    const { rerender } = render(<AppStartingOnSafeAccounts {...props} renderCount={1} />)

    rerender(<AppStartingOnSafeAccounts {...props} renderCount={2} />)
    rerender(<AppStartingOnSafeAccounts {...props} renderCount={3} />)

    expect(push).toHaveBeenCalledTimes(1)
  })
})
