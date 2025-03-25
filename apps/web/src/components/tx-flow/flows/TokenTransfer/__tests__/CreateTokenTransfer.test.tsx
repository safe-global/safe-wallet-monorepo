import { TokenTransferType } from '@/components/tx-flow/flows/TokenTransfer'
import { CreateTokenTransfer } from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import * as tokenUtils from '@/components/tx-flow/flows/TokenTransfer/utils'
import * as useHasPermission from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { render } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'

describe('CreateTokenTransfer', () => {
  const mockParams = {
    recipients: [
      {
        recipient: '',
        tokenAddress: ZERO_ADDRESS,
        amount: '',
      },
    ],
    type: TokenTransferType.multiSig,
  }

  const useHasPermissionSpy = jest.spyOn(useHasPermission, 'useHasPermission')

  beforeEach(() => {
    jest.clearAllMocks()
    useHasPermissionSpy.mockReturnValue(true)
  })

  it('should display a token amount input', () => {
    const { getByText } = render(<CreateTokenTransfer params={mockParams} onSubmit={jest.fn()} />)

    expect(getByText('Amount')).toBeInTheDocument()
  })

  it('should display a recipient input', () => {
    const { getAllByText } = render(<CreateTokenTransfer params={mockParams} onSubmit={jest.fn()} />)

    expect(getAllByText('Recipient address')[0]).toBeInTheDocument()
  })

  it('should display a type selection if a spending limit token is selected', () => {
    jest
      .spyOn(tokenUtils, 'useTokenAmount')
      .mockReturnValue({ totalAmount: BigInt(1000), spendingLimitAmount: BigInt(500) })

    const tokenAddress = ZERO_ADDRESS

    const { getByText } = render(<CreateTokenTransfer params={mockParams} onSubmit={jest.fn()} />, {
      initialReduxState: {
        balances: {
          loading: false,
          data: {
            fiatTotal: '0',
            items: [
              {
                balance: '10',
                tokenInfo: {
                  address: tokenAddress,
                  decimals: 18,
                  logoUri: 'someurl',
                  name: 'Test token',
                  symbol: 'TST',
                  type: TokenType.ERC20,
                },
                fiatBalance: '10',
                fiatConversion: '1',
              },
            ],
          },
        },
      },
    })

    expect(getByText('Send as')).toBeInTheDocument()

    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.CreateSpendingLimitTransaction)
  })

  it('should not display a type selection if user does not have `CreateSpendingLimitTransaction` permission', () => {
    useHasPermissionSpy.mockReturnValueOnce(false)
    const { queryByText } = render(<CreateTokenTransfer params={mockParams} onSubmit={jest.fn()} txNonce={1} />)

    expect(queryByText('Send as')).not.toBeInTheDocument()
    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.CreateSpendingLimitTransaction)
  })

  it('should not display a type selection if there is a txNonce', () => {
    const { queryByText } = render(<CreateTokenTransfer params={mockParams} onSubmit={jest.fn()} txNonce={1} />)

    expect(queryByText('Send as')).not.toBeInTheDocument()
  })
})
