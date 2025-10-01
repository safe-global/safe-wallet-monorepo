import { fireEvent, render, screen } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import type { ReactNode } from 'react'
import UnsupportedBaseContract from '../UnsupportedBaseContract'
import useIsUpgradeableMasterCopy from '@/hooks/useIsUpgradeableMasterCopy'

jest.mock('@/hooks/useIsUpgradeableMasterCopy')
jest.mock('@/services/datadog', () => ({
  useDatadog: jest.fn(),
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  },
}))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactNode }) => <>{children(true)}</>,
}))

const renderComponent = (setTxFlow = jest.fn()) =>
  render(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <UnsupportedBaseContract />
    </TxModalContext.Provider>,
  )

describe('UnsupportedBaseContract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useIsUpgradeableMasterCopy as jest.Mock).mockReturnValue(undefined)
  })

  it('renders nothing while the upgradeability is loading', () => {
    const { container } = renderComponent()

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a CLI warning when the mastercopy cannot be upgraded', () => {
    ;(useIsUpgradeableMasterCopy as jest.Mock).mockReturnValue(false)

    renderComponent()

    expect(
      screen.getByText(
        /Interacting with it from the web interface may not work correctly. We recommend using the Safe CLI instead\./i,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /migrate/i })).not.toBeInTheDocument()
  })

  it('enables the migrate action when the mastercopy can be upgraded', () => {
    const setTxFlow = jest.fn()
    ;(useIsUpgradeableMasterCopy as jest.Mock).mockReturnValue(true)

    renderComponent(setTxFlow)

    const migrateButton = screen.getByRole('button', { name: /migrate/i })
    expect(migrateButton).toBeEnabled()

    fireEvent.click(migrateButton)
    expect(setTxFlow).toHaveBeenCalledWith(expect.any(Object))
  })
})
