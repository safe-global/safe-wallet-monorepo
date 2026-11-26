import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { act, render, screen } from '@/tests/test-utils'
import { PendingStatus, PendingTxType, type PendingProcessingTx } from '@/store/pendingTxsSlice'
import * as useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import * as wallets from '@/utils/wallets'
import SpeedUpMonitor from '.'

jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: jest.fn() }))
const mockProvider = {}
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({ useWeb3ReadOnly: () => mockProvider }))
jest.mock('../SpeedUpModal', () => ({ __esModule: true, default: () => null }))

const NOW = new Date('2026-11-23T12:00:00.000Z').getTime()
const signerAddress = checksumAddress(faker.finance.ethereumAddress())

const pendingTx: PendingProcessingTx = {
  chainId: '1',
  safeAddress: checksumAddress(faker.finance.ethereumAddress()),
  nonce: 42,
  status: PendingStatus.PROCESSING,
  txType: PendingTxType.SAFE_TX,
  txHash: '0x1',
  submittedAt: NOW - 60_000,
  signerNonce: 1,
  signerAddress,
}

const settle = () => act(() => jest.advanceTimersByTimeAsync(0))

describe('SpeedUpMonitor', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW })
    jest.clearAllMocks()
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(wallets, 'isSmartContract').mockResolvedValue(false)
    ;(useWallet as jest.Mock).mockReturnValue(connectedWalletBuilder().with({ address: signerAddress }).build())
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('shows the row button with the nonce in its name and the hint in its tooltip', async () => {
    render(
      <SpeedUpMonitor txId="tx" pendingTx={pendingTx} modalTrigger="rowButton" hint="Fee may be too low." available />,
    )

    const button = screen.getByRole('button', { name: 'Speed up #42' })
    act(() => {
      button.focus()
    })
    await act(() => jest.advanceTimersByTimeAsync(200))

    expect(await screen.findByText('Fee may be too low.')).toBeInTheDocument()
  })

  it('skips its own check of the signer when the caller passes the availability, and reports it showed once', async () => {
    const onShow = jest.fn()

    render(
      <SpeedUpMonitor txId="tx" pendingTx={pendingTx} modalTrigger="rowButton" hint="hint" available onShow={onShow} />,
    )
    await settle()
    await act(() => jest.advanceTimersByTimeAsync(3_000))

    expect(wallets.isSmartContract).not.toHaveBeenCalled()
    expect(onShow).toHaveBeenCalledTimes(1)
  })

  it('renders nothing and does not report showing when the caller says it is unavailable', async () => {
    const onShow = jest.fn()

    const { container } = render(
      <SpeedUpMonitor txId="tx" pendingTx={pendingTx} modalTrigger="rowButton" available={false} onShow={onShow} />,
    )
    await settle()

    expect(container).toBeEmptyDOMElement()
    expect(onShow).not.toHaveBeenCalled()
  })

  it('checks the signer itself and shows the alert box without the new props', async () => {
    render(<SpeedUpMonitor txId="tx" pendingTx={pendingTx} modalTrigger="alertBox" />)
    await settle()

    expect(wallets.isSmartContract).toHaveBeenCalledWith(signerAddress)
    expect(screen.getByText('Taking too long?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Speed up >' })).toBeInTheDocument()
  })

  it('shows the plain alert button without the new props', async () => {
    render(<SpeedUpMonitor txId="tx" pendingTx={pendingTx} modalTrigger="alertButton" />)
    await settle()

    expect(screen.getByRole('button', { name: 'Speed up' })).toBeInTheDocument()
  })

  it('shows nothing before 15 seconds without the new props', async () => {
    const { container } = render(
      <SpeedUpMonitor txId="tx" pendingTx={{ ...pendingTx, submittedAt: NOW - 5_000 }} modalTrigger="alertButton" />,
    )
    await settle()

    expect(container).toBeEmptyDOMElement()
  })
})
