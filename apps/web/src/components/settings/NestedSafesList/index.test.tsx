import { fireEvent, render, screen } from '@/tests/test-utils'
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
  useChain: jest.fn(() => ({
    chainId: '1',
    shortName: 'eth',
    blockExplorerUriTemplate: { address: 'https://etherscan.io/address/{{address}}', txHash: '', api: '' },
  })),
}))

jest.mock('@/hooks/useSafeInfo')

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/owners', () => ({
  useOwnersGetSafesByOwnerV1Query: jest.fn(),
}))

const mockWriteScope: jest.Mock = jest.fn(() => ({ scope: 'local', canRename: true }))
jest.mock('@/features/spaces/hooks/useAddressBookWriteScope', () => ({
  useAddressBookWriteScope: (...args: unknown[]) => mockWriteScope(...args),
}))

jest.mock('@/hooks/useSafeDisplayName', () => ({ useSafeDisplayName: () => 'Nested name' }))

jest.mock('@/components/address-book/EntryDialog', () => {
  const Mock = ({ scope, defaultValues }: { scope?: string; defaultValues?: { address: string } }) => (
    <div data-testid="entry-dialog" data-scope={scope} data-address={defaultValues?.address} />
  )
  Mock.displayName = 'EntryDialog'
  return { __esModule: true, default: Mock }
})

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
    mockWriteScope.mockReturnValue({ scope: 'local', canRename: true })
  })

  const withNestedSafe = () => {
    ;(useOwnersGetSafesByOwnerV1Query as jest.MockedFunction<typeof useOwnersGetSafesByOwnerV1Query>).mockReturnValue({
      currentData: { safes: [faker.finance.ethereumAddress()] },
    } as unknown as ReturnType<typeof useOwnersGetSafesByOwnerV1Query>)
  }

  const renameButton = () => screen.getByTestId('rename-nested-safe-btn')

  it('renders the nested Safes empty state', () => {
    renderWithTxFlow()

    expect(screen.getByText('Nested Safes')).toBeInTheDocument()
    expect(screen.getByText(/You don't have any Nested Safes yet/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add nested Safe/i })).toBeEnabled()
  })

  it('enables rename for a Safe the viewer may rename', () => {
    withNestedSafe()
    renderWithTxFlow()

    expect(renameButton()).toBeEnabled()
  })

  it('scopes the rename by the parent Safe, not the nested one', () => {
    withNestedSafe()
    renderWithTxFlow()

    expect(mockWriteScope.mock.calls[0][0]).toBe(mockSafeAddress)
  })

  it('writes the nested address under the scope inherited from the parent', () => {
    withNestedSafe()
    mockWriteScope.mockReturnValue({ scope: 'workspace', canRename: true })
    renderWithTxFlow()

    fireEvent.click(renameButton())

    const dialog = screen.getByTestId('entry-dialog')
    expect(dialog).toHaveAttribute('data-scope', 'workspace')
    expect(dialog.getAttribute('data-address')).not.toBe(mockSafeAddress)
  })

  it('disables rename for a member looking at a workspace Safe', () => {
    withNestedSafe()
    mockWriteScope.mockReturnValue({ scope: 'local', canRename: false })
    renderWithTxFlow()

    expect(renameButton()).toBeDisabled()
  })
})
