import { render, screen } from '@/tests/test-utils'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import SendTransactionButton from '../SendTransactionButton'

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: jest.fn(), pathname: '/', query: {} }),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/hooks/useOwnedSafes', () => ({
  __esModule: true,
  default: jest.fn(),
}))

import useWallet from '@/hooks/wallets/useWallet'
import useOwnedSafes from '@/hooks/useOwnedSafes'

const mockedUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockedUseOwnedSafes = useOwnedSafes as jest.MockedFunction<typeof useOwnedSafes>

const EOA = '0x1111111111111111111111111111111111111111'
const PARENT_SAFE = '0x2222222222222222222222222222222222222222'
const NESTED_SAFE = '0x3333333333333333333333333333333333333333'

const buildOverview = (owners: string[]): SafeOverview =>
  ({
    chainId: '1',
    address: { value: NESTED_SAFE },
    owners: owners.map((value) => ({ value })),
  }) as unknown as SafeOverview

describe('SendTransactionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseOwnedSafes.mockReturnValue({})
  })

  it('enables the button when the connected wallet is a direct owner', () => {
    mockedUseWallet.mockReturnValue({ address: EOA } as ReturnType<typeof useWallet>)
    render(<SendTransactionButton safe={buildOverview([EOA])} />)

    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('enables the button when the connected wallet owns a parent Safe that is an owner', () => {
    mockedUseWallet.mockReturnValue({ address: EOA } as ReturnType<typeof useWallet>)
    mockedUseOwnedSafes.mockReturnValue({ '1': [PARENT_SAFE] })

    render(<SendTransactionButton safe={buildOverview([PARENT_SAFE])} />)

    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('disables the button when the wallet is neither a direct nor a nested owner', () => {
    mockedUseWallet.mockReturnValue({ address: EOA } as ReturnType<typeof useWallet>)
    mockedUseOwnedSafes.mockReturnValue({ '1': [] })

    render(<SendTransactionButton safe={buildOverview([PARENT_SAFE])} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disables the button when no wallet is connected', () => {
    mockedUseWallet.mockReturnValue(null)

    render(<SendTransactionButton safe={buildOverview([PARENT_SAFE])} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
