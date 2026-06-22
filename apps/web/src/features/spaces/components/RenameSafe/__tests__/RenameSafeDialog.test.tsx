import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { useAppSelector } from '@/store'
import RenameSafeDialog from '../RenameSafeDialog'
import type { RenameTarget } from '../types'

const mockUpsertSpace = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useAddressBooksUpsertAddressBookItemsV1Mutation: () => [mockUpsertSpace, {}],
}))

// The dialog defaults the network selector to the Safe's chains, resolved from useChains configs.
const mockConfigs = [
  { chainId: '1', chainName: 'Ethereum', shortName: 'eth' },
  { chainId: '137', chainName: 'Polygon', shortName: 'matic' },
]
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockConfigs }),
  useChain: (chainId: string) => mockConfigs.find((chain) => chain.chainId === chainId),
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
  return <div data-testid="probe">{name}</div>
}

describe('RenameSafeDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpsertSpace.mockResolvedValue({ data: {} })
  })

  it('prefills the current name', () => {
    render(<RenameSafeDialog target={baseTarget} onClose={jest.fn()} />)
    expect(screen.getByDisplayValue('Old name')).toBeInTheDocument()
  })

  it('writes the LOCAL address book for a non-space target', async () => {
    const onClose = jest.fn()
    const { user } = renderWithUserEvent(
      <>
        <RenameSafeDialog target={baseTarget} onClose={onClose} />
        <Probe chainId="1" />
      </>,
    )
    const input = screen.getByDisplayValue('Old name')
    await user.clear(input)
    await user.type(input, 'New name')
    await user.click(screen.getByTestId('save-btn'))
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('New name'))
    expect(mockUpsertSpace).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('writes the SPACE address book for a space target with all chainIds', async () => {
    const onClose = jest.fn()
    const { user } = renderWithUserEvent(
      <RenameSafeDialog target={{ ...baseTarget, isSpaceSafe: true, spaceId: 'space-uuid' }} onClose={onClose} />,
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
    await waitFor(() => expect(onClose).toHaveBeenCalled())
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
