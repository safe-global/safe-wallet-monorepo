import { screen } from '@/tests/test-utils'
import { render } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import PageLayout from './index'

jest.mock(
  '@/components/common/Header/Topbar',
  () =>
    function TopbarMock() {
      return <div>Topbar</div>
    },
)
jest.mock(
  '../Footer',
  () =>
    function FooterMock() {
      return <div>Footer</div>
    },
)
jest.mock(
  './SideDrawer',
  () =>
    function SideDrawerMock() {
      return <div>SideDrawer</div>
    },
)
jest.mock(
  '../SafeLoadingError',
  () =>
    function SafeLoadingErrorMock({ children }: { children: React.ReactNode }) {
      return <>{children}</>
    },
)
jest.mock(
  '@/components/common/Breadcrumbs',
  () =>
    function BreadcrumbsMock() {
      return <div>Breadcrumbs</div>
    },
)

jest.mock('@/hooks/useIsSidebarRoute', () => ({
  useIsSidebarRoute: jest.fn(() => [false, false]),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(() => false),
}))

jest.mock('@/hooks/useParentSafe', () => ({
  useParentSafe: jest.fn(() => null),
}))

jest.mock('@/hooks/useRouterGuard', () => ({
  useRouterGuard: jest.fn(),
}))

jest.mock('@/hooks/useRouterGuard/activationGuards/useFlowActivationGuard', () => ({
  useFlowActivationGuard: jest.fn(),
}))

jest.mock('@/hooks/useKeyboardObserver', () => ({
  useKeyboardObserver: jest.fn(),
}))

jest.mock('@/hooks/useTopbarElevation', () => ({
  useIsTopbarElevated: jest.fn(() => false),
}))

jest.mock('@/features/__core__', () => ({
  createFeatureHandle: jest.fn((name: string) => name),
  useLoadFeature: jest.fn(() => ({
    BatchSidebar: function BatchSidebarMock() {
      return <div>BatchSidebar</div>
    },
    SelectSafeModal: function SelectSafeModalMock() {
      return <div>SelectSafeModal</div>
    },
  })),
}))

describe('PageLayout', () => {
  it('does not render the floating help menu launcher', () => {
    render(
      <TxModalContext.Provider value={{ txFlow: undefined, setFullWidth: jest.fn() }}>
        <PageLayout pathname="/">
          <div>Page content</div>
        </PageLayout>
      </TxModalContext.Provider>,
    )

    expect(screen.getByText('Page content')).toBeInTheDocument()
    expect(screen.queryByLabelText('Help menu')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Close support chat')).not.toBeInTheDocument()
  })
})
