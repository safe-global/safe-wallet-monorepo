import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { useAppSelector } from '@/store'
import RenameSafeDialog from '../RenameSafeDialog'
import type { RenameTarget } from '../types'

const mockUpsertSpace = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useAddressBooksUpsertAddressBookItemsV1Mutation: () => [mockUpsertSpace, {}],
}))

// The dialog reads the existing space row's chain_ids (to preserve them) via getFromSpaceByAddress.
// Stub the exports the render tree uses (RenameSafeDialog + EthHashInfo inside AddressInputReadOnly);
// requireActual here trips a circular init, so provide them explicitly.
const mockGetFromSpaceByAddress = jest.fn((): { chainIds: string[] } | undefined => undefined)
jest.mock('@/hooks/useAllAddressBooks', () => ({
  __esModule: true,
  useMergedAddressBooks: () => ({ getFromSpaceByAddress: mockGetFromSpaceByAddress }),
  useAddressBookItem: () => undefined,
  ContactSource: { space: 'space', local: 'local' },
}))

const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

const baseTarget: RenameTarget = {
  address,
  chainIds: ['1', '137'],
  currentName: 'Old name',
  isSpaceSafe: false,
  spaceId: null,
}

// Reads the local address book so the test asserts resulting state, not dispatched actions.
function Probe({ chainId }: { chainId: string }) {
  const name = useAppSelector((s) => s.addressBook[chainId]?.[address] ?? '')
  return <div data-testid={`probe-${chainId}`}>{name}</div>
}

describe('RenameSafeDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetFromSpaceByAddress.mockReturnValue(undefined)
    mockUpsertSpace.mockResolvedValue({ data: {} })
  })

  it('prefills the current name', () => {
    render(<RenameSafeDialog target={baseTarget} onClose={jest.fn()} />)
    expect(screen.getByDisplayValue('Old name')).toBeInTheDocument()
  })

  it('renders no network picker — the name applies to all the Safe chains', () => {
    render(<RenameSafeDialog target={baseTarget} onClose={jest.fn()} />) // multichain target
    expect(screen.queryByTestId('select-all-checkbox')).not.toBeInTheDocument()
    expect(screen.queryByTestId('network-checkbox')).not.toBeInTheDocument()
  })

  it('writes the LOCAL name to ALL the Safe chains for a non-space target', async () => {
    const onClose = jest.fn()
    const { user } = renderWithUserEvent(
      <>
        <RenameSafeDialog target={baseTarget} onClose={onClose} />
        <Probe chainId="1" />
        <Probe chainId="137" />
      </>,
    )
    const input = screen.getByDisplayValue('Old name')
    await user.clear(input)
    await user.type(input, 'New name')
    await user.click(screen.getByTestId('save-btn'))
    await waitFor(() => expect(screen.getByTestId('probe-1')).toHaveTextContent('New name'))
    expect(screen.getByTestId('probe-137')).toHaveTextContent('New name')
    expect(mockUpsertSpace).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('writes the SPACE address book with the Safe chains for a brand-new entry', async () => {
    mockGetFromSpaceByAddress.mockReturnValue(undefined) // no existing space row
    const { user } = renderWithUserEvent(
      <RenameSafeDialog target={{ ...baseTarget, isSpaceSafe: true, spaceId: 'space-uuid' }} onClose={jest.fn()} />,
    )
    const input = screen.getByDisplayValue('Old name')
    await user.clear(input)
    await user.type(input, 'Shared name')
    await user.click(screen.getByTestId('save-btn'))
    await waitFor(() =>
      expect(mockUpsertSpace).toHaveBeenCalledWith({
        spaceId: 'space-uuid',
        upsertAddressBookItemsDto: { items: [{ name: 'Shared name', address, chainIds: ['1', '137'] }] },
      }),
    )
  })

  it('PRESERVES the existing space chain_ids on rename (does not expand to the Safe chains)', async () => {
    mockGetFromSpaceByAddress.mockReturnValue({ chainIds: ['1'] }) // existing row scoped to chain 1
    const { user } = renderWithUserEvent(
      <RenameSafeDialog target={{ ...baseTarget, isSpaceSafe: true, spaceId: 'space-uuid' }} onClose={jest.fn()} />,
    )
    const input = screen.getByDisplayValue('Old name')
    await user.clear(input)
    await user.type(input, 'Shared name')
    await user.click(screen.getByTestId('save-btn'))
    await waitFor(() =>
      expect(mockUpsertSpace).toHaveBeenCalledWith({
        spaceId: 'space-uuid',
        upsertAddressBookItemsDto: { items: [{ name: 'Shared name', address, chainIds: ['1'] }] },
      }),
    )
  })

  it('keeps the dialog open and shows an error if the space write fails', async () => {
    mockUpsertSpace.mockResolvedValue({ error: { status: 500 } })
    const onClose = jest.fn()
    const { user } = renderWithUserEvent(
      <RenameSafeDialog target={{ ...baseTarget, isSpaceSafe: true, spaceId: 'space-uuid' }} onClose={onClose} />,
    )
    const input = screen.getByDisplayValue('Old name')
    await user.clear(input)
    await user.type(input, 'Shared name')
    await user.click(screen.getByTestId('save-btn'))
    await waitFor(() => expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument())
    expect(onClose).not.toHaveBeenCalled()
  })
})
