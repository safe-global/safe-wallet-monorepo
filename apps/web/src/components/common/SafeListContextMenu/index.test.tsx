import { fireEvent, render, screen } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import { trackEvent } from '@/services/analytics'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import SafeListContextMenu from '.'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockNestedSafe = '0x2222222222222222222222222222222222222222'
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/owners', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/owners'),
  useOwnersGetSafesByOwnerV1Query: () => ({ currentData: { safes: [mockNestedSafe] } }),
}))

const mockWriteScope: jest.Mock = jest.fn(() => ({ scope: 'local', canRename: true }))
jest.mock('@/features/spaces/hooks/useAddressBookWriteScope', () => ({
  useAddressBookWriteScope: (...args: unknown[]) => mockWriteScope(...args),
}))

jest.mock('next/router', () => ({
  __esModule: true,
  default: { pathname: '/welcome/accounts' },
  useRouter: () => ({ pathname: '/welcome/accounts', query: {}, push: jest.fn() }),
}))

jest.mock('@/components/address-book/EntryDialog', () => {
  const Mock = ({ scope }: { scope?: string }) => <div data-testid="entry-dialog" data-scope={scope} />
  Mock.displayName = 'EntryDialog'
  return { __esModule: true, default: Mock }
})

const ADDRESS = '0x1111111111111111111111111111111111111111'
const CHAIN_ID = '1'

const renderMenu = ({ hideNestedSafes = true } = {}) =>
  render(
    <SafeListContextMenu
      name="Treasury"
      address={ADDRESS}
      chainId={CHAIN_ID}
      addNetwork={false}
      rename
      undeployedSafe={false}
      hideNestedSafes={hideNestedSafes}
    />,
  )

const openMenu = () => fireEvent.click(screen.getByTestId('safe-options-btn'))

describe('SafeListContextMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWriteScope.mockReturnValue({ scope: 'local', canRename: true })
  })

  it('resolves the write scope for the Safe on its chain', () => {
    renderMenu()

    expect(mockWriteScope).toHaveBeenCalledWith(ADDRESS, [CHAIN_ID])
  })

  it('opens the rename dialog when the viewer may rename', () => {
    renderMenu()
    openMenu()

    fireEvent.click(screen.getByTestId('rename-btn'))

    expect(screen.getByTestId('entry-dialog')).toBeInTheDocument()
  })

  it('passes the resolved scope to the dialog so an admin write reaches the workspace', () => {
    mockWriteScope.mockReturnValue({ scope: 'workspace', canRename: true })
    renderMenu()
    openMenu()

    fireEvent.click(screen.getByTestId('rename-btn'))

    expect(screen.getByTestId('entry-dialog')).toHaveAttribute('data-scope', 'workspace')
  })

  it('disables rename for a member looking at a workspace Safe', () => {
    mockWriteScope.mockReturnValue({ scope: 'local', canRename: false })
    renderMenu()
    openMenu()

    fireEvent.click(screen.getByTestId('rename-btn'))

    expect(screen.queryByTestId('entry-dialog')).not.toBeInTheDocument()
  })

  it('tracks opening the nested Safes list with the nested Safes label on the accounts page', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    renderMenu({ hideNestedSafes: false })
    openMenu()

    fireEvent.click(screen.getByTestId('nested-safes-btn'))

    expect(trackEvent).toHaveBeenCalledWith(
      { ...NESTED_SAFE_EVENTS.OPEN_LIST, label: NESTED_SAFE_LABELS.sidebar },
      undefined,
    )
  })
})
