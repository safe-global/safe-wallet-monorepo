import { render } from '@/tests/test-utils'
import OnlyOwnerOrProposer from './index'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsWalletProposer } from '@/hooks/useProposers'

jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useProposers', () => ({ useIsWalletProposer: jest.fn() }))
jest.mock('../ConnectWallet/useConnectWallet', () => jest.fn(() => jest.fn()))

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseIsSafeOwner = useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>
const mockUseIsWalletProposer = useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>

describe('OnlyOwnerOrProposer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children with true when wallet is owner', () => {
    mockUseWallet.mockReturnValue({ address: '0x1234' } as ReturnType<typeof useWallet>)
    mockUseIsSafeOwner.mockReturnValue(true)
    mockUseIsWalletProposer.mockReturnValue(false)

    const { getByText } = render(
      <OnlyOwnerOrProposer>{(isOk) => <button disabled={!isOk}>Action</button>}</OnlyOwnerOrProposer>,
    )

    expect(getByText('Action')).not.toBeDisabled()
  })

  it('should render children with true when wallet is proposer but not owner', () => {
    mockUseWallet.mockReturnValue({ address: '0x1234' } as ReturnType<typeof useWallet>)
    mockUseIsSafeOwner.mockReturnValue(false)
    mockUseIsWalletProposer.mockReturnValue(true)

    const { getByText } = render(
      <OnlyOwnerOrProposer>{(isOk) => <button disabled={!isOk}>Action</button>}</OnlyOwnerOrProposer>,
    )

    expect(getByText('Action')).not.toBeDisabled()
  })

  it('should render children with false when wallet is neither owner nor proposer', () => {
    mockUseWallet.mockReturnValue({ address: '0x1234' } as ReturnType<typeof useWallet>)
    mockUseIsSafeOwner.mockReturnValue(false)
    mockUseIsWalletProposer.mockReturnValue(false)

    const { getByText } = render(
      <OnlyOwnerOrProposer>{(isOk) => <button disabled={!isOk}>Action</button>}</OnlyOwnerOrProposer>,
    )

    expect(getByText('Action')).toBeDisabled()
  })

  it('should render children with false when wallet is not connected', () => {
    mockUseWallet.mockReturnValue(null)
    mockUseIsSafeOwner.mockReturnValue(false)
    mockUseIsWalletProposer.mockReturnValue(false)

    const { getByText } = render(
      <OnlyOwnerOrProposer>{(isOk) => <button disabled={!isOk}>Action</button>}</OnlyOwnerOrProposer>,
    )

    expect(getByText('Action')).toBeDisabled()
  })
})
