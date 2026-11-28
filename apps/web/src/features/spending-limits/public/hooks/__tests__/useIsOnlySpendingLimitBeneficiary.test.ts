import { renderHook } from '@/tests/test-utils'
import type { RootState } from '@/store'
import useWallet, { useSigner } from '@/hooks/wallets/useWallet'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import useSpendingLimits from '../useSpendingLimits'
import useIsOnlySpendingLimitBeneficiary from '../useIsOnlySpendingLimitBeneficiary'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('../useSpendingLimits')
jest.mock('@/hooks/useProposers')

const wallet = connectedWalletBuilder().build()
const otherAddress = connectedWalletBuilder().build().address

type Scenario = {
  ownerAddresses: string[]
  beneficiaries: string[]
  isProposer?: boolean
}

const renderAsWallet = ({ ownerAddresses, beneficiaries, isProposer = false }: Scenario) => {
  jest.mocked(useWallet).mockReturnValue(wallet)
  jest.mocked(useSigner).mockReturnValue({ ...wallet, provider: null })
  jest.mocked(useIsWalletProposer).mockReturnValue(isProposer)

  const owners = ownerAddresses.map((value) => addressExBuilder().with({ value }).build())
  const spendingLimits = beneficiaries.map((beneficiary) => spendingLimitStateBuilder().with({ beneficiary }).build())
  const initialReduxState: Partial<RootState> = {
    safeInfo: { data: extendedSafeInfoBuilder().with({ owners }).build(), loaded: true, loading: false },
  }
  jest.mocked(useSpendingLimits).mockReturnValue({ spendingLimits, loading: false })

  return renderHook(() => useIsOnlySpendingLimitBeneficiary(), { initialReduxState })
}

describe('useIsOnlySpendingLimitBeneficiary', () => {
  it('returns true for a beneficiary who is not an owner', () => {
    const { result } = renderAsWallet({ ownerAddresses: [otherAddress], beneficiaries: [wallet.address] })

    expect(result.current).toBe(true)
  })

  it('returns false for an owner who is also a beneficiary', () => {
    const { result } = renderAsWallet({ ownerAddresses: [wallet.address], beneficiaries: [wallet.address] })

    expect(result.current).toBe(false)
  })

  it('returns false for a proposer who is also a beneficiary', () => {
    const { result } = renderAsWallet({
      ownerAddresses: [otherAddress],
      beneficiaries: [wallet.address],
      isProposer: true,
    })

    expect(result.current).toBe(false)
  })

  it('returns false when the Safe has no spending limits', () => {
    const { result } = renderAsWallet({ ownerAddresses: [otherAddress], beneficiaries: [] })

    expect(result.current).toBe(false)
  })

  it('returns false when the spending limits belong to another address', () => {
    const { result } = renderAsWallet({ ownerAddresses: [otherAddress], beneficiaries: [otherAddress] })

    expect(result.current).toBe(false)
  })
})
