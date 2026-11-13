import { AppRoutes } from '@/config/routes'
import { render, screen } from '@/tests/test-utils'
import { TOUR_STEPS } from '../constants'
import TourStop from '../TourStop'

const OPEN_SAFE_STEP = TOUR_STEPS.find(({ id }) => id === 'open-safe')!

const addElement = (testId: string) => {
  const element = document.createElement('div')
  element.dataset.testid = testId
  document.body.appendChild(element)
}

const renderOpenSafeStop = () => {
  const push = jest.fn()
  render(
    <TourStop
      step={OPEN_SAFE_STEP}
      progress={{ current: 4, total: 7 }}
      onBack={jest.fn()}
      onNext={jest.fn()}
      onClose={jest.fn()}
      onMissingAnchor={jest.fn()}
    />,
    { routerProps: { pathname: AppRoutes.spaces.safeAccounts, query: { spaceId: '1' }, push } },
  )
  return { push }
}

describe('TourStop', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('draws a placeholder row when the workspace has no Safe accounts', async () => {
    addElement('safe-accounts-empty')

    renderOpenSafeStop()

    expect(await screen.findByTestId('workspace-tour-placeholder-row')).toBeInTheDocument()
    expect(screen.getByText('Open a Safe to work inside it')).toBeInTheDocument()
  })

  it('outlines the sidebar item of the page it explains', async () => {
    addElement('safe-accounts-empty')
    addElement('sidebar-item-safe-accounts')

    renderOpenSafeStop()

    expect(await screen.findAllByTestId('workspace-tour-highlight')).toHaveLength(2)
  })

  it('stays on the page when the member is already on it', () => {
    addElement('safe-accounts-empty')

    const { push } = renderOpenSafeStop()

    expect(push).not.toHaveBeenCalled()
  })
})
