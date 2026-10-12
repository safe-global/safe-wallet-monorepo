import { render, screen } from '@/tests/test-utils'
import TxStatusWidget from '.'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAlreadySigned } from '@/components/tx/shared/hooks'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createMockSafeTransaction } from '@/tests/transactions'
import { faker } from '@faker-js/faker'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: jest.fn(() => true) }))
jest.mock('@/hooks/useProposers', () => ({
  __esModule: true,
  default: jest.fn(),
  useIsWalletProposer: jest.fn(() => false),
}))
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({ address: '0x1234567890000000000000000000000000000009', chainId: '1' })),
  useSigner: jest.fn(() => ({ address: '0x1234567890000000000000000000000000000009', chainId: '1' })),
}))
jest.mock('@/components/tx/shared/hooks', () => ({
  __esModule: true,
  useAlreadySigned: jest.fn(() => false),
}))

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseAlreadySigned = useAlreadySigned as jest.MockedFunction<typeof useAlreadySigned>
const safeInfo = extendedSafeInfoBuilder().build()

const safeTxContext = {
  safeTx: createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' }),
  nonceNeeded: true,
} as unknown as SafeTxContextParams

const renderWidget = (threshold: number, props: Parameters<typeof TxStatusWidget>[0] = {}) => {
  mockUseSafeInfo.mockReturnValue({
    safe: { ...safeInfo, threshold },
    safeAddress: safeInfo.address.value,
    safeLoading: false,
    safeLoaded: true,
    safeError: undefined,
  } as ReturnType<typeof useSafeInfo>)

  return render(
    <SafeTxContext.Provider value={safeTxContext}>
      <TxStatusWidget {...props} />
    </SafeTxContext.Provider>,
  )
}

describe('TxStatusWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAlreadySigned.mockReturnValue(false)
  })

  it('shows a Sign step before Execute on a 1/n Safe', () => {
    renderWidget(1)

    const labels = screen.getAllByRole('listitem').map((item) => item.textContent)

    expect(labels).toEqual(['Create', 'Confirmed (0 of 1)+1', 'Sign', 'Execute'])
  })

  it('marks the Sign step incomplete until the signer has signed', () => {
    renderWidget(1)

    expect(screen.getByText('Sign').closest('li')).toHaveClass('incomplete')
  })

  it('marks the Sign step complete once the signer has signed', () => {
    mockUseAlreadySigned.mockReturnValue(true)

    renderWidget(1)

    expect(screen.getByText('Sign').closest('li')).not.toHaveClass('incomplete')
  })

  it('shows no Sign step on an m/n Safe', () => {
    renderWidget(2)

    expect(screen.queryByText('Sign')).not.toBeInTheDocument()
  })

  it('shows no Sign step for batches or messages', () => {
    renderWidget(1, { isBatch: true })
    expect(screen.queryByText('Sign')).not.toBeInTheDocument()

    renderWidget(1, { isMessage: true })
    expect(screen.queryByText('Sign')).not.toBeInTheDocument()
  })
})
