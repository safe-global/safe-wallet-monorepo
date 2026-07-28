import { render } from '@/tests/test-utils'
import { screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type SafeVersion } from '@safe-global/types-kit'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { type ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { type Eip1193Provider } from 'ethers'

import AdvancedOptionsStep from '@/components/new-safe/create/steps/AdvancedOptionsStep'
import { type NewSafeFormData } from '@/components/new-safe/create'
import * as createLogic from '@/components/new-safe/create/logic'
import * as multichain from '@/features/multichain'
import * as useChains from '@/hooks/useChains'
import * as useWallet from '@/hooks/wallets/useWallet'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import * as wallets from '@/utils/wallets'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'

const mockChain = { chainId: '100', chainName: 'Gnosis Chain', l2: false } as Chain

const PREDICTED_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockData: NewSafeFormData = {
  name: 'Test',
  networks: [mockChain],
  threshold: 1,
  owners: [{ name: '', address: ZERO_ADDRESS }],
  saltNonce: 0,
  safeVersion: LATEST_SAFE_VERSION as SafeVersion,
  paymentReceiver: ZERO_ADDRESS,
}

const renderStep = () =>
  render(<AdvancedOptionsStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />)

const getReceiverField = () => screen.getByLabelText('Payment receiver')

const getFieldContainer = (input: HTMLElement) => input.closest('[data-slot="field"]')

describe('AdvancedOptionsStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useWallet, 'default').mockReturnValue({ address: ZERO_ADDRESS } as ConnectedWallet)
    jest
      .spyOn(web3ReadOnly, 'useWeb3ReadOnly')
      .mockReturnValue({ provider: {} as Eip1193Provider } as unknown as ReturnType<
        typeof web3ReadOnly.useWeb3ReadOnly
      >)
    jest
      .spyOn(createLogic, 'createNewUndeployedSafeWithoutSalt')
      .mockReturnValue({ safeVersion: LATEST_SAFE_VERSION } as Omit<ReplayedSafeProps, 'saltNonce'>)
    jest.spyOn(multichain, 'predictAddressBasedOnReplayData').mockResolvedValue(PREDICTED_ADDRESS)
    jest.spyOn(wallets, 'isSmartContract').mockResolvedValue(false)
  })

  it('marks the payment receiver invalid when it is cleared', async () => {
    renderStep()

    await userEvent.clear(getReceiverField())

    expect(await screen.findByText('Payment receiver is required')).toBeInTheDocument()
    expect(getReceiverField()).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('flags the payment receiver container as invalid so the label turns destructive', async () => {
    renderStep()

    await userEvent.clear(getReceiverField())

    await waitFor(() => expect(getFieldContainer(getReceiverField())).toHaveAttribute('data-invalid', 'true'))
  })

  it('warns about an already deployed Safe for a valid payment receiver', async () => {
    jest.spyOn(wallets, 'isSmartContract').mockResolvedValue(true)

    renderStep()

    expect(
      await screen.findByText('The Safe is already deployed. Use a different payment receiver.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('does not let an empty payment receiver swallow the already deployed warning', async () => {
    jest.spyOn(wallets, 'isSmartContract').mockResolvedValue(true)

    renderStep()

    await screen.findByText('The Safe is already deployed. Use a different payment receiver.')
    await userEvent.clear(getReceiverField())

    expect(await screen.findByText('Payment receiver is required')).toBeInTheDocument()
  })

  it('marks the salt nonce invalid when it is cleared', async () => {
    renderStep()

    const saltNonce = screen.getByLabelText('Salt nonce')
    await userEvent.clear(saltNonce)

    expect(await screen.findByText('Salt nonce is required')).toBeInTheDocument()
    expect(saltNonce).toHaveAttribute('aria-invalid', 'true')
  })
})
