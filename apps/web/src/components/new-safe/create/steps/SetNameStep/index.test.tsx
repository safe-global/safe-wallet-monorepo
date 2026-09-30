import { render } from '@/tests/test-utils'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type SafeVersion } from '@safe-global/types-kit'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'

import SetNameStep from '@/components/new-safe/create/steps/SetNameStep'
import { type NewSafeFormData } from '@/components/new-safe/create'
import { AppRoutes } from '@/config/routes'
import * as useChains from '@/hooks/useChains'
import * as useWallet from '@/hooks/wallets/useWallet'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'

const mockChain = {
  chainId: '100',
  chainName: 'Gnosis Chain',
  l2: false,
  theme: { backgroundColor: '#000', textColor: '#fff' },
} as Chain

const mockData: NewSafeFormData = {
  name: 'Test',
  networks: [mockChain],
  threshold: 1,
  owners: [{ name: '', address: ZERO_ADDRESS }],
  safeVersion: LATEST_SAFE_VERSION as SafeVersion,
}

const renderStep = (routerProps: { query?: Record<string, string>; push?: jest.Mock }) =>
  render(
    <SetNameStep
      data={mockData}
      onSubmit={jest.fn()}
      onBack={jest.fn()}
      setStep={jest.fn()}
      setSafeName={jest.fn()}
      setOverviewNetworks={jest.fn()}
      setDynamicHint={jest.fn()}
    />,
    { routerProps },
  )

describe('SetNameStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useChains, 'useChain').mockReturnValue(mockChain)
    jest.spyOn(useWallet, 'default').mockReturnValue({ address: ZERO_ADDRESS, chainId: '100' } as ConnectedWallet)
  })

  it('returns to the page in the next param on cancel', async () => {
    const mockPush = jest.fn()
    renderStep({ query: { next: '/welcome/accounts?chain=sep' }, push: mockPush })

    await userEvent.click(screen.getByTestId('cancel-btn'))

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/welcome/accounts', query: { chain: 'sep' } })
  })

  it('falls back to the spaces welcome page on cancel without a next param', async () => {
    const mockPush = jest.fn()
    renderStep({ query: {}, push: mockPush })

    await userEvent.click(screen.getByTestId('cancel-btn'))

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })
})
