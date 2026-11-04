import { fireEvent, render, screen } from '@/tests/test-utils'
import MultiAccountContextMenu from './MultiAccountContextMenu'

const mockWriteScope: jest.Mock = jest.fn(() => ({ scope: 'local', canRename: true }))
jest.mock('@/features/spaces/hooks/useAddressBookWriteScope', () => ({
  useAddressBookWriteScope: (...args: unknown[]) => mockWriteScope(...args),
}))

jest.mock('next/router', () => ({ __esModule: true, default: { pathname: '/welcome/accounts' } }))

jest.mock('@/components/address-book/EntryDialog', () => {
  const Mock = ({ scope }: { scope?: string }) => <div data-testid="entry-dialog" data-scope={scope} />
  Mock.displayName = 'EntryDialog'
  return { __esModule: true, default: Mock }
})

const ADDRESS = '0x1111111111111111111111111111111111111111'
const CHAIN_IDS = ['1', '137']

const renderMenu = () =>
  render(<MultiAccountContextMenu name="Treasury" address={ADDRESS} chainIds={CHAIN_IDS} addNetwork={false} />)

const openMenu = () => fireEvent.click(screen.getByTestId('safe-options-btn'))

describe('MultiAccountContextMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWriteScope.mockReturnValue({ scope: 'local', canRename: true })
  })

  it('resolves the write scope for the Safe and all of its chains', () => {
    renderMenu()

    expect(mockWriteScope).toHaveBeenCalledWith(ADDRESS, CHAIN_IDS)
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
})
