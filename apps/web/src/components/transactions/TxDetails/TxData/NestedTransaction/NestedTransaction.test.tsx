import { act, render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { chainBuilder } from '@/tests/builders/chains'
import { useCurrentChain } from '@/hooks/useChains'
import { NestedTransaction } from './NestedTransaction'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [], loading: false, loaded: true, error: undefined })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(() => false),
}))

const mockUseCurrentChain = useCurrentChain as jest.Mock
const safeInterface = Safe__factory.createInterface()

const CHILD_SAFE = faker.finance.ethereumAddress()
const SIGNED_HASH = faker.string.hexadecimal({ length: 64, casing: 'lower' })
const SPACE_ID = faker.string.uuid()

const approveHashTxData: TransactionData = {
  hexData: safeInterface.encodeFunctionData('approveHash', [SIGNED_HASH]),
  dataDecoded: {
    method: 'approveHash',
    parameters: [{ name: 'hashToApprove', type: 'bytes32', value: SIGNED_HASH }],
  },
  to: { value: CHILD_SAFE, name: null, logoUri: null },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}

const renderNestedTransaction = async ({
  txData = approveHashTxData,
  isConfirmationView,
  spaceId,
}: { txData?: TransactionData | null; isConfirmationView?: boolean; spaceId?: string } = {}) => {
  render(
    <NestedTransaction txData={txData} isConfirmationView={isConfirmationView}>
      <div>Child transaction</div>
    </NestedTransaction>,
    { routerProps: { query: spaceId ? { spaceId } : {} } },
  )
  // NamedAddressInfo resolves its contract lookup after the first render
  await act(async () => {})
}

const OPEN_LINK = { name: /Open/ }

const queryOpenLink = () => screen.queryByRole('link', OPEN_LINK)

const getOpenLinkUrl = () => new URL(screen.getByRole('link', OPEN_LINK).getAttribute('href') ?? '', 'http://localhost')

describe('NestedTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentChain.mockReturnValue(chainBuilder().with({ chainId: '1', shortName: 'eth' }).build())
  })

  it('renders the header and the child content', async () => {
    await renderNestedTransaction()

    expect(screen.getByText('Nested transaction')).toBeInTheDocument()
    expect(screen.getByText('Child transaction')).toBeInTheDocument()
  })

  it('links "Open" to the approved transaction in the child Safe', async () => {
    await renderNestedTransaction()

    const url = getOpenLinkUrl()
    expect(url.pathname).toBe('/transactions/tx')
    expect(url.searchParams.get('safe')).toBe(`eth:${CHILD_SAFE}`)
    expect(url.searchParams.get('id')).toBe(SIGNED_HASH)
    expect(url.searchParams.has('spaceId')).toBe(false)
  })

  it('keeps the Workspace id in the "Open" link', async () => {
    await renderNestedTransaction({ spaceId: SPACE_ID })

    expect(getOpenLinkUrl().searchParams.get('spaceId')).toBe(SPACE_ID)
  })

  it('does not render the "Open" link for calldata that is not approveHash', async () => {
    await renderNestedTransaction({
      txData: {
        ...approveHashTxData,
        hexData: safeInterface.encodeFunctionData('changeThreshold', [2]),
        dataDecoded: { method: 'changeThreshold', parameters: [] },
      },
    })

    expect(screen.getByText('Nested transaction')).toBeInTheDocument()
    expect(queryOpenLink()).not.toBeInTheDocument()
  })

  it('does not render the "Open" link without a current chain', async () => {
    mockUseCurrentChain.mockReturnValue(undefined)

    await renderNestedTransaction()

    expect(queryOpenLink()).not.toBeInTheDocument()
  })

  it('does not render the "Open" link without transaction data', async () => {
    await renderNestedTransaction({ txData: null })

    expect(screen.getByText('Child transaction')).toBeInTheDocument()
    expect(queryOpenLink()).not.toBeInTheDocument()
  })

  it('shows the outer method call outside the confirmation view', async () => {
    await renderNestedTransaction({ isConfirmationView: false })

    expect(screen.getByText('approveHash')).toBeInTheDocument()
  })

  it('hides the outer method call in the confirmation view', async () => {
    await renderNestedTransaction({ isConfirmationView: true })

    expect(screen.queryByText('approveHash')).not.toBeInTheDocument()
    expect(screen.getByText('Child transaction')).toBeInTheDocument()
  })
})
