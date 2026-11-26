import { useEffect, useState } from 'react'
import type { NextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { TOUR_TARGETS } from '@safe-global/views/features/spaces/components/WorkspaceTour/tourTargets'
import { AppRoutes } from '@/config/routes'
import { act, render, screen } from '@/tests/test-utils'
import { TOUR_STEPS } from '../constants'
import { ANCHOR_TIMEOUT_MS } from '../hooks/useStopLayout'
import TourStop from '../TourStop'

const WORKSPACE_CONTACTS_STEP = TOUR_STEPS.find(({ id }) => id === 'workspace-contacts')!
const SLOWER_THAN_ANCHOR_WAIT_MS = ANCHOR_TIMEOUT_MS + 2000

const AddressBookPage = () => (
  <main>
    <Tabs defaultValue="workspace">
      <TabsList>
        <TabsTrigger value="workspace" data-tour={TOUR_TARGETS.workspaceContactsTab}>
          Workspace contacts
        </TabsTrigger>
        <TabsTrigger value="mine" data-tour={TOUR_TARGETS.localContactsTab}>
          Local contacts
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </main>
)

type AppProps = {
  startOn: string
  goTo: string
  afterMs: number
  onClose: jest.Mock
  onMissingAnchor: jest.Mock
}

const AppOnWorkspaceContactsStop = ({ startOn, goTo, afterMs, onClose, onMissingAnchor }: AppProps) => {
  const [pathname, setPathname] = useState(startOn)
  const router = { pathname, query: { spaceId: '1' }, isReady: true } as unknown as NextRouter

  useEffect(() => {
    const timeout = setTimeout(() => setPathname(goTo), afterMs)
    return () => clearTimeout(timeout)
  }, [goTo, afterMs])

  return (
    <RouterContext.Provider value={router}>
      {pathname === AppRoutes.spaces.addressBook && <AddressBookPage />}
      <TourStop
        step={WORKSPACE_CONTACTS_STEP}
        progress={{ current: 5, total: 7 }}
        onBack={jest.fn()}
        onNext={jest.fn()}
        onClose={onClose}
        onMissingAnchor={onMissingAnchor}
      />
    </RouterContext.Provider>
  )
}

describe('TourStop across a page change', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false })
  })

  it('shows the stop once its page loads, even when loading takes longer than the anchor wait', async () => {
    const onClose = jest.fn()
    const onMissingAnchor = jest.fn()
    render(
      <AppOnWorkspaceContactsStop
        startOn={AppRoutes.spaces.safeAccounts}
        goTo={AppRoutes.spaces.addressBook}
        afterMs={SLOWER_THAN_ANCHOR_WAIT_MS}
        onClose={onClose}
        onMissingAnchor={onMissingAnchor}
      />,
    )

    await act(async () => jest.advanceTimersByTime(SLOWER_THAN_ANCHOR_WAIT_MS))
    await act(async () => jest.advanceTimersByTime(100))

    expect(onMissingAnchor).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText('Address book entries everyone in the workspace can see.')).toBeInTheDocument()
  })

  it('closes the tour when the member leaves the stop page on their own', async () => {
    const onClose = jest.fn()
    render(
      <AppOnWorkspaceContactsStop
        startOn={AppRoutes.spaces.addressBook}
        goTo={AppRoutes.spaces.safeAccounts}
        afterMs={1000}
        onClose={onClose}
        onMissingAnchor={jest.fn()}
      />,
    )

    await act(async () => jest.advanceTimersByTime(1000))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
