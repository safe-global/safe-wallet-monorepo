import { render, screen } from '@/tests/test-utils'
import { NestedSafesList } from '.'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { useHasFeature } from '@/hooks/useChains'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { faker } from '@faker-js/faker'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useHasFeature: jest.fn(() => true),
}))

jest.mock('@/hooks/useSafeInfo')

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/owners', () => ({
  useOwnersGetSafesByOwnerV1Query: jest.fn(),
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => React.ReactNode }) => children(true),
}))

const mockSafeAddress = faker.finance.ethereumAddress()
const mockSetTxFlow = jest.fn()

const renderWithTxFlow = () => {
  const txModalValue: TxModalContextType = {
    txFlow: undefined,
    setTxFlow: mockSetTxFlow,
    setFullWidth: jest.fn(),
  }

  return render(
    <TxModalContext.Provider value={txModalValue}>
      <NestedSafesList />
    </TxModalContext.Provider>,
  )
}

describe('NestedSafesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useHasFeature as jest.MockedFunction<typeof useHasFeature>).mockReturnValue(true)
    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: mockSafeAddress } })
        .with({ deployed: true })
        .build(),
      safeLoaded: true,
    } as ReturnType<typeof useSafeInfo>)
    ;(useOwnersGetSafesByOwnerV1Query as jest.MockedFunction<typeof useOwnersGetSafesByOwnerV1Query>).mockReturnValue({
      currentData: { safes: [] },
    } as unknown as ReturnType<typeof useOwnersGetSafesByOwnerV1Query>)
  })

  it('renders nested Safe settings in a shared card shell', () => {
    renderWithTxFlow()

    const title = screen.getByText('Nested Safes')
    expect(title.closest('[data-slot="card"]')).toHaveClass('mt-4')
    expect(screen.getByText(/You don't have any Nested Safes yet/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add nested Safe/i })).toBeEnabled()
  })
})
