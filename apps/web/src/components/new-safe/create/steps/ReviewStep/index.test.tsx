import type { NewSafeFormData } from '@/components/new-safe/create'
import * as useChains from '@/hooks/useChains'
import * as relay from '@/utils/relaying'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

import { render } from '@/tests/test-utils'
import ReviewStep, { NetworkFee } from '@/components/new-safe/create/steps/ReviewStep/index'
import * as useWallet from '@/hooks/wallets/useWallet'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { act, fireEvent, screen } from '@testing-library/react'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import { type SafeVersion } from '@safe-global/safe-core-sdk-types'

const mockChainInfo = {
  chainId: '100',
  chainName: 'Gnosis Chain',
  l2: false,
  nativeCurrency: {
    symbol: 'ETH',
  },
} as ChainInfo

describe('NetworkFee', () => {
  it('should display the total fee', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue({ label: 'MetaMask' } as unknown as ConnectedWallet)
    const mockTotalFee = '0.0123'
    const result = render(<NetworkFee totalFee={mockTotalFee} chain={mockChainInfo} isWaived={true} />)

    expect(result.getByText(`≈ ${mockTotalFee} ${mockChainInfo.nativeCurrency.symbol}`)).toBeInTheDocument()
  })
})

describe('ReviewStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display a pay now pay later option for counterfactual safe setups', () => {
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: [mockChainInfo],
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
      networks: [mockChainInfo],
      threshold: 1,
      owners: [{ name: '', address: '0x1' }],
      saltNonce: 0,
      safeVersion: LATEST_SAFE_VERSION as SafeVersion,
    }
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    render(<ReviewStep data={mockData} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />)

    const payLaterOption = screen.getByRole('radio', { name: /Pay later/i })
    expect(payLaterOption).toBeChecked()
  })

  it('should not display the network fee for counterfactual safes', () => {
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: [mockChainInfo],
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
      networks: [mockChainInfo],
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
      networks: [mockChainInfo],
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
      networks: [mockChainInfo],
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

  it('should display the execution method for counterfactual safes if the user selects pay now and there is relaying', async () => {
    const mockMultiChainInfo = [
      {
        chainId: '100',
        chainName: 'Gnosis Chain',
        l2: false,
        nativeCurrency: {
          symbol: 'ETH',
        },
      },
      {
        chainId: '1',
        chainName: 'Ethereum',
        l2: false,
        nativeCurrency: {
          symbol: 'ETH',
        },
      },
    ] as ChainInfo[]
    const mockData: NewSafeFormData = {
      name: 'Test',
      networks: mockMultiChainInfo,
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

    expect(getByText(/activate your account/)).toBeInTheDocument()
  })
})
