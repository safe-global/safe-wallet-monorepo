import { useContext, useState } from 'react'
import { faker } from '@faker-js/faker'
import type { PairingTypes } from '@walletconnect/types'
import { act, fireEvent, render, screen } from '@/tests/test-utils'
import WcInput, { PROPOSAL_TIMEOUT } from '../index'
import { WalletConnectContext } from '../../WalletConnectContext'
import WalletConnectWallet from '../../../services/WalletConnectWallet'
import { WCLoadingState } from '../../../types'

jest.mock('@reown/walletkit', () => jest.fn())

const PAIRING_URI = 'wc:7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9@2?relay-protocol=irn'
const TIMEOUT_MESSAGE =
  'Connection timed out. If you already used this pairing code, copy a new one from the dApp and try again.'

const pairing: PairingTypes.Struct = {
  topic: faker.string.hexadecimal({ length: 64, prefix: '' }),
  expiry: faker.date.future().getTime(),
  relay: { protocol: 'irn' },
  active: false,
}

const Harness = ({ walletConnect }: { walletConnect: WalletConnectWallet }) => {
  const context = useContext(WalletConnectContext)
  const [loading, setLoading] = useState<WCLoadingState | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  return (
    <WalletConnectContext.Provider value={{ ...context, walletConnect, loading, setLoading, error, setError }}>
      {isOpen && <WcInput uri={PAIRING_URI} />}
      <button onClick={() => setIsOpen(false)}>Close popup</button>
      <button onClick={() => setLoading(null)}>Receive proposal</button>
      <button onClick={() => setLoading(WCLoadingState.APPROVE)}>Start approving</button>
      {error && <p>{error.message}</p>}
    </WalletConnectContext.Provider>
  )
}

describe('WcInput', () => {
  let walletConnect: WalletConnectWallet

  beforeEach(() => {
    jest.useFakeTimers()
    walletConnect = new WalletConnectWallet()
    jest.spyOn(walletConnect, 'connect').mockResolvedValue(pairing)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderInput = async () => {
    render(<Harness walletConnect={walletConnect} />)
    await act(async () => {})
  }

  it('connects once with a pre-filled pairing code', async () => {
    await renderInput()

    expect(walletConnect.connect).toHaveBeenCalledTimes(1)
    expect(walletConnect.connect).toHaveBeenCalledWith(PAIRING_URI)
  })

  it('shows a timeout error when no proposal arrives in time', async () => {
    await renderInput()

    act(() => jest.advanceTimersByTime(PROPOSAL_TIMEOUT - 1))
    expect(screen.queryByText(TIMEOUT_MESSAGE)).not.toBeInTheDocument()

    act(() => jest.advanceTimersByTime(1))
    expect(screen.getByText(TIMEOUT_MESSAGE)).toBeInTheDocument()
  })

  it('does not time out once the proposal has arrived', async () => {
    await renderInput()

    fireEvent.click(screen.getByText('Receive proposal'))
    act(() => jest.advanceTimersByTime(PROPOSAL_TIMEOUT))

    expect(screen.queryByText(TIMEOUT_MESSAGE)).not.toBeInTheDocument()
  })

  it('does not time out while the proposal is being approved', async () => {
    await renderInput()

    fireEvent.click(screen.getByText('Start approving'))
    act(() => jest.advanceTimersByTime(PROPOSAL_TIMEOUT))

    expect(screen.queryByText(TIMEOUT_MESSAGE)).not.toBeInTheDocument()
  })

  it('times a new pairing code from its own start', async () => {
    await renderInput()
    fireEvent.click(screen.getByText('Receive proposal'))
    act(() => jest.advanceTimersByTime(PROPOSAL_TIMEOUT / 2))

    fireEvent.change(screen.getByLabelText('Pairing code'), { target: { value: `${PAIRING_URI}&second=1` } })
    await act(async () => {})

    act(() => jest.advanceTimersByTime(PROPOSAL_TIMEOUT / 2 + 1))
    expect(screen.queryByText(TIMEOUT_MESSAGE)).not.toBeInTheDocument()

    act(() => jest.advanceTimersByTime(PROPOSAL_TIMEOUT / 2))
    expect(screen.getByText(TIMEOUT_MESSAGE)).toBeInTheDocument()
  })

  it('does not time out when the popup closed while connecting', async () => {
    let finishConnecting: (value: PairingTypes.Struct) => void = () => {}
    jest.spyOn(walletConnect, 'connect').mockReturnValue(new Promise((resolve) => (finishConnecting = resolve)))
    await renderInput()

    fireEvent.click(screen.getByText('Close popup'))
    await act(async () => finishConnecting(pairing))
    fireEvent.click(screen.getByText('Receive proposal'))
    act(() => jest.advanceTimersByTime(PROPOSAL_TIMEOUT))

    expect(screen.queryByText(TIMEOUT_MESSAGE)).not.toBeInTheDocument()
  })

  it('shows the pairing error instead of a timeout when connecting fails', async () => {
    jest.spyOn(walletConnect, 'connect').mockRejectedValue(new Error('Pairing already exists'))
    await renderInput()

    act(() => jest.advanceTimersByTime(PROPOSAL_TIMEOUT))

    expect(screen.getByText('Pairing already exists')).toBeInTheDocument()
    expect(screen.queryByText(TIMEOUT_MESSAGE)).not.toBeInTheDocument()
  })
})
