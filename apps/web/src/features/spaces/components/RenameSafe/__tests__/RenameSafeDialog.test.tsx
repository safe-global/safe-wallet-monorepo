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
// Lets a test simulate configs not being loaded yet (empty array).
let mockConfigsOverride: typeof mockConfigs | null = null
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockConfigsOverride ?? mockConfigs }),
  useChain: (chainId: string) => (mockConfigsOverride ?? mockConfigs).find((chain) => chain.chainId === chainId),
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
    mockConfigsOverride = null
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

  it('falls back to the Safe chains when configs are not loaded (never writes empty chainIds)', async () => {
    mockConfigsOverride = []
    const { user } = renderWithUserEvent(
      <>
        <RenameSafeDialog target={baseTarget} onClose={jest.fn()} />
        <Probe chainId="1" />
      </>,
    )
    const input = screen.getByDisplayValue('Old name')
    await user.clear(input)
    await user.type(input, 'Fallback name')
    await user.click(screen.getByTestId('save-btn'))
    // Empty configs → the chain selector never renders; the write must still target the Safe's
    // own chains (target.chainIds) rather than an empty set, so the name lands on chain '1'.
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('Fallback name'))
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
