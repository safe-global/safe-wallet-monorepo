import { TOUR_TARGETS } from '@safe-global/views/features/spaces/components/WorkspaceTour/tourTargets'
import { AppRoutes } from '@/config/routes'
import { render, screen } from '@/tests/test-utils'
import { TOUR_STEPS } from '../constants'
import TourStop from '../TourStop'

const OPEN_SAFE_STEP = TOUR_STEPS.find(({ id }) => id === 'open-safe')!

const addEmptySafeAccounts = () => {
  const element = document.createElement('div')
  element.dataset.tour = TOUR_TARGETS.safeAccountsEmpty
  document.body.appendChild(element)
}

const addSidebarItem = () => {
  const element = document.createElement('div')
  element.dataset.testid = 'sidebar-item-safe-accounts'
  document.body.appendChild(element)
}

const renderOpenSafeStop = () =>
  render(
    <TourStop
      step={OPEN_SAFE_STEP}
      progress={{ current: 4, total: 7 }}
      onBack={jest.fn()}
      onNext={jest.fn()}
      onClose={jest.fn()}
      onMissingAnchor={jest.fn()}
    />,
    { routerProps: { pathname: AppRoutes.spaces.safeAccounts, query: { spaceId: '1' } } },
  )

describe('TourStop', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('draws a placeholder row when the workspace has no Safe accounts', async () => {
    addEmptySafeAccounts()

    renderOpenSafeStop()

    expect(await screen.findByTestId('workspace-tour-placeholder-row')).toBeInTheDocument()
    expect(screen.getByText('Open a Safe to work inside it')).toBeInTheDocument()
  })

  it('outlines the sidebar item of the page it explains', async () => {
    addEmptySafeAccounts()
    addSidebarItem()

    renderOpenSafeStop()

    expect(await screen.findAllByTestId('workspace-tour-highlight')).toHaveLength(2)
  })
})
