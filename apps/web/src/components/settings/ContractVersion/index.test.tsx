import { fireEvent, render, screen } from '@/tests/test-utils'
import { ContractVersion } from '.'
import { TxModalContext } from '@/components/tx-flow'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'
import useIsUpgradeableMasterCopy from '@/hooks/useIsUpgradeableMasterCopy'
import { MasterCopyDeployer, useMasterCopies } from '@/hooks/useMasterCopies'
import { useCurrentChain } from '@/hooks/useChains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import type { ReactNode } from 'react'
import { MigrateSafeL2Flow, UpdateSafeFlow } from '@/components/tx-flow/flows'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useMasterCopies')
jest.mock('@/hooks/useChains')
jest.mock('@/hooks/useIsUpgradeableMasterCopy')
jest.mock('@safe-global/utils/utils/chains')
jest.mock('@/components/tx-flow/flows', () => ({
  __esModule: true,
  MigrateSafeL2Flow: jest.fn(() => null),
  UpdateSafeFlow: jest.fn(() => null),
}))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactNode }) => <>{children(true)}</>,
}))
jest.mock('@/features/multichain/components/UnsupportedMastercopyWarning/UnsupportedMasterCopyWarning', () => ({
  __esModule: true,
  UnsupportedMastercopyWarning: () => <div data-testid="unsupported-warning" />,
}))

const mockSafeInfo = useSafeInfo as jest.Mock
const mockUseMasterCopies = useMasterCopies as unknown as jest.Mock
const mockUseCurrentChain = useCurrentChain as jest.Mock
const mockIsUpgradeableMasterCopy = useIsUpgradeableMasterCopy as jest.Mock
const mockGetLatestSafeVersion = getLatestSafeVersion as jest.Mock

const mockMigrateFlow = MigrateSafeL2Flow as jest.Mock
const mockUpdateFlow = UpdateSafeFlow as jest.Mock

const renderContractVersion = (setTxFlow = jest.fn()) => {
  return render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <ContractVersion />
    </TxModalContext.Provider>,
  )
}

describe('ContractVersion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentChain.mockReturnValue({} as any)
    mockUseMasterCopies.mockReturnValue([[]])
    mockGetLatestSafeVersion.mockReturnValue('1.4.1')
  })

  it('enables the migration flow for upgradeable unsupported master copies', () => {
    const baseSafe = {
      implementationVersionState: ImplementationVersionState.UNKNOWN,
      implementation: { value: '0x1' },
      version: undefined,
      chainId: '10',
    }

    mockSafeInfo.mockReturnValue({ safe: baseSafe, safeLoaded: true })
    mockIsUpgradeableMasterCopy.mockReturnValue(true)

    const setTxFlow = jest.fn()

    renderContractVersion(setTxFlow)

    const updateButton = screen.getByRole('button', { name: /update/i })
    expect(updateButton).toBeEnabled()
    fireEvent.click(updateButton)

    expect(setTxFlow).toHaveBeenCalledWith(expect.objectContaining({ type: mockMigrateFlow }))
    expect(mockUpdateFlow).not.toHaveBeenCalled()
    expect(screen.queryByTestId('unsupported-warning')).not.toBeInTheDocument()
  })

  it('uses the standard update flow for outdated official master copies', () => {
    const baseSafe = {
      implementationVersionState: ImplementationVersionState.OUTDATED,
      implementation: { value: '0x1' },
      version: '1.3.0',
      chainId: '10',
    }

    mockSafeInfo.mockReturnValue({ safe: baseSafe, safeLoaded: true })
    mockIsUpgradeableMasterCopy.mockReturnValue(false)
    mockUseMasterCopies.mockReturnValue([
      [
        {
          address: '0x1',
          version: '1.3.0',
          deployer: MasterCopyDeployer.GNOSIS,
          deployerRepoUrl: 'https://example.com',
        },
      ],
    ])

    const setTxFlow = jest.fn()

    renderContractVersion(setTxFlow)

    const updateButton = screen.getByRole('button', { name: /update/i })
    fireEvent.click(updateButton)

    expect(setTxFlow).toHaveBeenCalledWith(expect.objectContaining({ type: mockUpdateFlow }))
    expect(mockMigrateFlow).not.toHaveBeenCalled()
  })
})
