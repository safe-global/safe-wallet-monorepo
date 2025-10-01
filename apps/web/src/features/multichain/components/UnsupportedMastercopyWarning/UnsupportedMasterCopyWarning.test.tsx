import { fireEvent, render, screen } from '@/tests/test-utils'
import { UnsupportedMastercopyWarning } from './UnsupportedMasterCopyWarning'
import { TxModalContext } from '@/components/tx-flow'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsUpgradeableMasterCopy from '@/hooks/useIsUpgradeableMasterCopy'
import type { ReactNode } from 'react'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useIsUpgradeableMasterCopy')
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactNode }) => <>{children(true)}</>,
}))

const renderWithContext = (setTxFlow = jest.fn()) => {
  return render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <UnsupportedMastercopyWarning />
    </TxModalContext.Provider>,
  )
}

const baseSafe = {
  implementationVersionState: 'UNKNOWN',
  implementation: { value: '0x1' },
  chainId: '10',
}

describe('UnsupportedMastercopyWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSafeInfo as jest.Mock).mockReturnValue({ safe: baseSafe })
    ;(useIsUpgradeableMasterCopy as jest.Mock).mockReturnValue({ isUpgradeable: undefined })
  })

  it('renders nothing when the mastercopy is supported', () => {
    ;(useSafeInfo as jest.Mock).mockReturnValue({
      safe: {
        ...baseSafe,
        implementationVersionState: 'UP_TO_DATE',
      },
    })
    ;(useIsUpgradeableMasterCopy as jest.Mock).mockReturnValue({ isUpgradeable: false })

    const { container } = renderWithContext()

    expect(container).toBeEmptyDOMElement()
  })

  it('shows a CLI warning when the mastercopy cannot be upgraded', () => {
    ;(useIsUpgradeableMasterCopy as jest.Mock).mockReturnValue({ isUpgradeable: false })

    renderWithContext()

    expect(
      screen.getByText(
        /Interacting with it from the web interface may not work correctly. We recommend using the Safe CLI instead./i,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /migrate/i })).not.toBeInTheDocument()
  })

  it('enables the migrate flow when the mastercopy can be upgraded', () => {
    const setTxFlow = jest.fn()
    ;(useIsUpgradeableMasterCopy as jest.Mock).mockReturnValue({ isUpgradeable: true })

    renderWithContext(setTxFlow)

    const migrateButton = screen.getByRole('button', { name: /migrate/i })
    expect(migrateButton).toBeEnabled()

    fireEvent.click(migrateButton)
    expect(setTxFlow).toHaveBeenCalledWith(expect.any(Object))
  })
})
