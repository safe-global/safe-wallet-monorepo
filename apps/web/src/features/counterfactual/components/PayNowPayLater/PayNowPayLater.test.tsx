import { render, screen } from '@/tests/test-utils'
import PayNowPayLater from './index'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import * as useChains from '@/hooks/useChains'
import * as nativeToken from '@/hooks/useNativeTokenDisplay'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

jest.mock('@/services/siwe/useSiwe', () => ({
  useSiwe: () => ({ signIn: jest.fn(), loading: false }),
}))

describe('PayNowPayLater', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue({ nativeCurrency: { symbol: 'ETH' } } as unknown as Chain)
    jest.spyOn(nativeToken, 'useNativeTokenDisplay').mockReturnValue({
      showGasFeeEstimation: true,
      showStablecoinFeeInfo: false,
    } as unknown as ReturnType<typeof nativeToken.useNativeTokenDisplay>)
  })

  it('shows "Sponsored free transaction" for Pay now when relay will be used', () => {
    render(
      <PayNowPayLater
        totalFee="0.01"
        canRelay
        isMultiChain={false}
        payMethod={PayMethod.PayNow}
        setPayMethod={jest.fn()}
      />,
    )

    expect(screen.getByText('Sponsored free transaction')).toBeInTheDocument()
  })

  it('shows the fee estimation for Pay now when relay will not be used (connected wallet)', () => {
    render(
      <PayNowPayLater
        totalFee="0.01"
        canRelay={false}
        isMultiChain={false}
        payMethod={PayMethod.PayNow}
        setPayMethod={jest.fn()}
      />,
    )

    expect(screen.queryByText('Sponsored free transaction')).not.toBeInTheDocument()
    expect(screen.getByText(/0\.01 ETH/)).toBeInTheDocument()
  })

  it('disables Pay now and shows the multichain hint for multichain creation', () => {
    render(
      <PayNowPayLater
        totalFee="0.01"
        canRelay={false}
        isMultiChain
        payMethod={PayMethod.PayLater}
        setPayMethod={jest.fn()}
      />,
    )

    expect(screen.getByText('Not available for multiple networks')).toBeInTheDocument()
    expect(screen.getByText(/activate your account/)).toBeInTheDocument()
    // Base UI radios expose disabled state via aria-disabled rather than the disabled attribute.
    expect(screen.getByRole('radio', { name: 'Pay now' })).toHaveAttribute('aria-disabled', 'true')
  })
})
