import type { NewSafeFormData } from '@/components/new-safe/create'
import * as useChains from '@/hooks/useChains'
import * as relay from '@/utils/relaying'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { render } from '@/tests/test-utils'
import ReviewStep, { NetworkFee } from '@/components/new-safe/create/steps/ReviewStep/index'
import * as useWallet from '@/hooks/wallets/useWallet'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { act, fireEvent, screen } from '@testing-library/react'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import { type SafeVersion } from '@safe-global/types-kit'
import * as cfServices from '@/features/counterfactual/services'
import * as spaceServices from '@/features/spaces/services'
import * as useIsWrongChain from '@/hooks/useIsWrongChain'
import * as multichain from '@/features/multichain'
import * as createLogic from '@/components/new-safe/create/logic'
import * as web3 from '@/hooks/wallets/web3'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { type ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'

const mockChain = {
  chainId: '100',
  chainName: 'Gnosis Chain',
  l2: false,
  nativeCurrency: {
    symbol: 'ETH',
  },
} as Chain

describe('NetworkFee', () => {
  it('should display the total fee', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue({ label: 'MetaMask' } as unknown as ConnectedWallet)
    const mockTotalFee = '0.0123'
    const result = render(<NetworkFee totalFee={mockTotalFee} chain={mockChain} isWaived={true} />)

    expect(result.getByText(`≈ ${mockTotalFee} ${mockChain.nativeCurrency.symbol}`)).toBeInTheDocument()
  })
})

describe('ReviewStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display a pay now pay later option for counterfactual safe setups', () => {
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: [mockChain],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    }
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { getByText } = render(
      <ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
    )

    expect(getByText('Pay now')).toBeInTheDocument()
  })

  it('should display a pay later option as selected by default for counterfactual safe setups', () => {
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: [mockChain],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    }
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    render(<ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />, {
      initialReduxState: {
        auth: {
          sessionExpiresAt: Date.now() + 60000,
          lastUsedSpace: null,
          isStoreHydrated: true,
          cfSafeSynced: false,
          isOidcLoginPending: false,
        },
      },
    })

    const payLaterOption = screen.getByRole('radio', { name: /Pay later/i })
    expect(payLaterOption).toBeChecked()
  })

  it('should not display the network fee for counterfactual safes', () => {
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: [mockChain],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    }
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { queryByText } = render(
      <ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
    )

    expect(queryByText('You will have to confirm a transaction and pay an estimated fee')).not.toBeInTheDocument()
  })

  it('should not display the execution method for counterfactual safes', () => {
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: [mockChain],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    }
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { queryByText } = render(
      <ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
    )

    expect(queryByText('Who will pay gas fees:')).not.toBeInTheDocument()
  })

  it('should display the network fee for counterfactual safes if the user selects pay now', async () => {
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: [mockChain],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    }
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { getByText } = render(
      <ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
    )

    const payNow = getByText('Pay now')

    act(() => {
      fireEvent.click(payNow)
    })

    expect(getByText(/You will have to confirm a transaction and pay an estimated fee/)).toBeInTheDocument()
  })

  it('should display the execution method for counterfactual safes if the user selects pay now and there is relaying', async () => {
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: [mockChain],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    }
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(relay, 'hasRemainingRelays').mockReturnValue(true)

    const { getByText } = render(
      <ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
    )

    const payNow = getByText('Pay now')

    act(() => {
      fireEvent.click(payNow)
    })

    expect(getByText(/Who will pay gas fees:/)).toBeInTheDocument()
  })

  const authReduxState = {
    auth: {
      sessionExpiresAt: Date.now() + 60000,
      lastUsedSpace: null,
      isStoreHydrated: true,
      cfSafeSynced: false,
      isOidcLoginPending: false,
    },
  }

  const buildMultiChainData = (): NewSafeFormData => {
    const chainWithFeatures = { ...mockChain, features: [] } as Chain
    return {
      name: 'Test',
      networks: [chainWithFeatures, { ...chainWithFeatures, chainId: '1', chainName: 'Ethereum' } as Chain],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    }
  }

  it('shows the selector with Pay now disabled for multichain creation', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { getByTestId, getByText } = render(
      <ReviewStep data={buildMultiChainData()} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
      { initialReduxState: authReduxState },
    )

    expect(getByTestId('pay-now-later-message-box')).toBeInTheDocument()
    expect(getByText(/activate your account/)).toBeInTheDocument()
    expect(getByText(/Start exploring the accounts now/)).toBeInTheDocument()
    expect(getByText('Not available for multiple networks')).toBeInTheDocument()
    expect(getByTestId('pay-now-execution-method').querySelector('input')).toBeDisabled()
    expect(screen.getByRole('radio', { name: /Pay later/i })).toBeChecked()
  })

  it('disables creation for multichain until the user signs in (Pay later writes to the backend)', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    // No auth state provided -> the user is not authenticated.
    const { getByTestId } = render(
      <ReviewStep data={buildMultiChainData()} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
    )

    expect(getByTestId('review-step-next-btn')).toBeDisabled()
  })

  it('does not block multichain creation when counterfactual is disabled', () => {
    // Counterfactual off -> no PayLater forcing, no sign-in gate (direct deployment path).
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

    const { getByTestId } = render(
      <ReviewStep data={buildMultiChainData()} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
    )

    expect(getByTestId('review-step-next-btn')).not.toBeDisabled()
  })

  it('creates counterfactual safes on each network for multichain when authenticated', async () => {
    const mockData = buildMultiChainData()

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockData.networks[0])
    jest.spyOn(useWallet, 'default').mockReturnValue({ provider: {} } as unknown as ConnectedWallet)
    jest
      .spyOn(createLogic, 'createNewUndeployedSafeWithoutSalt')
      .mockReturnValue({ safeAccountConfig: { owners: ['0x1'], threshold: 1 } } as unknown as ReplayedSafeProps)
    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue({} as ReturnType<typeof web3.createWeb3ReadOnly>)
    jest
      .spyOn(multichain, 'predictAddressBasedOnReplayData')
      .mockResolvedValue('0x0000000000000000000000000000000000000001')
    const persistSpy = jest.spyOn(cfServices, 'persistCounterfactualSafe').mockResolvedValue({ ok: true })

    render(<ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />, {
      initialReduxState: authReduxState,
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('review-step-next-btn'))
    })

    expect(persistSpy).toHaveBeenCalledTimes(mockData.networks.length)
    expect(persistSpy).toHaveBeenCalledWith(
      expect.objectContaining({ payMethod: PayMethod.PayLater, isUserAuthenticated: true }),
    )
  })

  describe('direct deployment (pay now)', () => {
    const SPACE_UUID = '11111111-1111-1111-1111-111111111111'
    const PREDICTED_ADDRESS = '0x0000000000000000000000000000000000000001'

    const spaceAuthReduxState = {
      auth: { ...authReduxState.auth, lastUsedSpace: SPACE_UUID },
    }

    const buildSingleChainData = (): NewSafeFormData => ({
      name: 'Test',
      networks: [{ ...mockChain, features: [] } as Chain],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    })

    /** Drives the non-counterfactual branch: counterfactual off => the Safe is deployed directly. */
    const renderAndDeploy = async (reduxState: object) => {
      const mockData = buildSingleChainData()

      jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockData.networks[0])
      jest.spyOn(useWallet, 'default').mockReturnValue({ provider: {} } as unknown as ConnectedWallet)
      // Explicit: earlier tests in this file leave a `true` spy behind (clearAllMocks
      // keeps implementations), which would route creation through the relay path.
      jest.spyOn(relay, 'hasRemainingRelays').mockReturnValue(false)
      // The direct path blocks submission behind the wrong-network warning.
      jest.spyOn(useIsWrongChain, 'default').mockReturnValue(false)
      jest
        .spyOn(createLogic, 'createNewUndeployedSafeWithoutSalt')
        .mockReturnValue({ safeAccountConfig: { owners: ['0x1'], threshold: 1 } } as unknown as ReplayedSafeProps)
      jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue({} as ReturnType<typeof web3.createWeb3ReadOnly>)
      jest.spyOn(multichain, 'predictAddressBasedOnReplayData').mockResolvedValue(PREDICTED_ADDRESS)
      // Invoke the onSubmit callback as a real deployment would once the tx is broadcast.
      jest
        .spyOn(createLogic, 'createNewSafe')
        .mockImplementation(async (_provider, _props, _chain, _options, onSubmit) => {
          onSubmit?.('0xTxHash')
          return undefined as never
        })

      render(<ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />, {
        initialReduxState: reduxState,
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId('review-step-next-btn'))
      })
    }

    it('adds the deployed Safe to the active workspace', async () => {
      const addSpy = jest.spyOn(spaceServices, 'addSafeToSpace').mockResolvedValue({ status: 'added' })

      await renderAndDeploy(spaceAuthReduxState)

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: '100', safeAddress: PREDICTED_ADDRESS, spaceId: SPACE_UUID }),
      )
    })

    it('does not touch the backend when the user has no SIWE session', async () => {
      const addSpy = jest.spyOn(spaceServices, 'addSafeToSpace').mockResolvedValue({ status: 'added' })

      await renderAndDeploy({})

      // The Safe is still deployed — only the workspace call is skipped.
      expect(createLogic.createNewSafe).toHaveBeenCalledTimes(1)
      expect(addSpy).not.toHaveBeenCalled()
    })

    it('still completes creation when the workspace add fails', async () => {
      const addSpy = jest.spyOn(spaceServices, 'addSafeToSpace').mockResolvedValue({
        status: 'failed',
        error: new Error('Failed to add Safe account to workspace'),
        isLimitRejection: false,
      })

      await renderAndDeploy(spaceAuthReduxState)

      expect(addSpy).toHaveBeenCalledTimes(1)
      // The transaction is already broadcast, so creation must not be reported as failed.
      expect(screen.queryByText(/Error creating the Safe account/)).not.toBeInTheDocument()
    })
  })
})
