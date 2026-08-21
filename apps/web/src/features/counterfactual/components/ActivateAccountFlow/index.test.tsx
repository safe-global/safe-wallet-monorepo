import { render, screen } from '@/tests/test-utils'
import type { ReactElement } from 'react'
import ActivateAccountFlow from './index'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import * as nativeToken from '@/hooks/useNativeTokenDisplay'
import * as safeDeployment from '../../services/safeDeployment'
import * as undeployedSafes from '../../store/undeployedSafesSlice'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { faker } from '@faker-js/faker'

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

// The Safe Shield sidebar and the status rail pull in network-heavy hooks; this suite is about the
// flow's own chrome and footer, not theirs.
jest.mock('@/features/safe-shield', () => ({
  __esModule: true,
  default: () => <div data-testid="safe-shield-widget">SafeShield</div>,
}))

jest.mock('@/components/tx-flow/common/TxStatusWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="tx-status-widget">StatusRail</div>,
}))

const owner = faker.finance.ethereumAddress()
const safeAddress = faker.finance.ethereumAddress()

describe('ActivateAccountFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: { chainId: '1', deployed: false, address: { value: safeAddress }, owners: [], threshold: 1 },
      safeAddress,
      safeLoaded: true,
    } as unknown as ReturnType<typeof useSafeInfoHook.default>)
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue({
      chainId: '1',
      chainName: 'Ethereum',
      features: [],
      nativeCurrency: { symbol: 'ETH' },
    } as unknown as Chain)
    jest.spyOn(nativeToken, 'useNativeTokenDisplay').mockReturnValue({
      showGasFeeEstimation: true,
      showInsufficientFundsWarning: false,
    } as unknown as ReturnType<typeof nativeToken.useNativeTokenDisplay>)

    jest
      .spyOn(undeployedSafes, 'selectUndeployedSafe')
      .mockReturnValue({ props: {}, status: {} } as ReturnType<typeof undeployedSafes.selectUndeployedSafe>)
    jest
      .spyOn(safeDeployment, 'extractCounterfactualSafeSetup')
      .mockReturnValue({ owners: [owner], threshold: 1, safeVersion: '1.4.1' } as ReturnType<
        typeof safeDeployment.extractCounterfactualSafeSetup
      >)
  })

  it('renders the page title', () => {
    render(<ActivateAccountFlow />)

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Activate account')
  })

  /**
   * The flow used to pass neither subtitle nor icon, so the shared chrome collapsed its header row
   * and left a bare progress bar above a square-topped card. Every sibling flow fills this row.
   */
  it('fills the shared header row instead of leaving a bare progress bar', () => {
    render(<ActivateAccountFlow />)

    const header = screen.getByTestId('modal-header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveTextContent('Deploy Safe account')
  })

  it('renders the submit button in the shared card footer', () => {
    render(<ActivateAccountFlow />)

    const button = screen.getByTestId('activate-account-flow-btn')
    expect(button).toBeEnabled()
    expect(button.closest('[data-slot="tx-card-footer"]')).not.toBeNull()
  })

  it('renders nothing when the Safe has no undeployed setup to activate', () => {
    jest.spyOn(safeDeployment, 'extractCounterfactualSafeSetup').mockReturnValue(undefined)

    render(<ActivateAccountFlow />)

    expect(screen.queryByTestId('activate-account-flow-btn')).not.toBeInTheDocument()
  })
})
