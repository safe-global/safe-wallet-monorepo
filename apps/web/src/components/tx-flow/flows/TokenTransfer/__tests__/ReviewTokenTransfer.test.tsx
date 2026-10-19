import { render, waitFor } from '@/tests/test-utils'
import ReviewTokenTransfer from '../ReviewTokenTransfer'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import * as useTrustedTokenBalances from '@/hooks/loadables/useTrustedTokenBalances'
import * as txSender from '@/services/tx/tx-sender'
import { TokenType } from '@safe-global/store/gateway/types'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  TokenTransferType,
  type MultiTokenTransferParams,
} from '@safe-global/views/components/tx-flow/flows/TokenTransfer/types'
import type Safe from '@safe-global/protocol-kit'
import { faker } from '@faker-js/faker'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { safeScopeContextFor } from '@/tests/mocks/safeScope'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('ReviewTokenTransfer', () => {
  const mockSetSafeTx = jest.fn()
  const mockSetSafeTxError = jest.fn()
  const mockSetNonce = jest.fn()

  const mockParams: MultiTokenTransferParams = {
    recipients: [
      {
        recipient: '0x1234567890123456789012345678901234567890',
        tokenAddress: USDC_ADDRESS,
        amount: '100',
      },
    ],
    type: TokenTransferType.multiSig,
  }

  const mockBalances = {
    fiatTotal: '1000',
    items: [
      {
        balance: '1000000000000000000',
        tokenInfo: {
          address: ZERO_ADDRESS,
          decimals: 18,
          logoUri: '',
          name: 'Ether',
          symbol: 'ETH',
          type: TokenType.NATIVE_TOKEN,
        },
        fiatBalance: '1000',
        fiatConversion: '1000',
      },
      {
        balance: '1000000000',
        tokenInfo: {
          address: USDC_ADDRESS,
          decimals: 6,
          logoUri: '',
          name: 'USD Coin',
          symbol: 'USDC',
          type: TokenType.ERC20,
        },
        fiatBalance: '1000',
        fiatConversion: '1',
      },
    ],
  }

  const useTrustedTokenBalancesSpy = jest.spyOn(useTrustedTokenBalances, 'useTrustedTokenBalances')
  const createMultiSendCallOnlyTxSpy = jest.spyOn(txSender, 'createMultiSendCallOnlyTx')

  beforeEach(() => {
    jest.clearAllMocks()
    useTrustedTokenBalancesSpy.mockReturnValue([mockBalances, undefined, false])
    createMultiSendCallOnlyTxSpy.mockResolvedValue({} as any)
  })

  const renderComponent = (params = mockParams, txNonce?: number, scope?: SafeScopeContextValue) =>
    render(
      <SafeScopeContext.Provider value={scope}>
        <SafeTxContext.Provider
          value={{
            setSafeTx: mockSetSafeTx,
            setSafeTxError: mockSetSafeTxError,
            setNonce: mockSetNonce,
            setSafeMessage: jest.fn(),
            setSafeMessageHash: jest.fn(),
            setNonceNeeded: jest.fn(),
            setSafeTxGas: jest.fn(),
            setTxOrigin: jest.fn(),
            isReadOnly: false,
            gtfPaymentMode: 'safe',
            setGtfPaymentMode: jest.fn(),
            setGtfSelectedGasToken: jest.fn(),
          }}
        >
          <ReviewTokenTransfer params={params} onSubmit={jest.fn()} txNonce={txNonce} />
        </SafeTxContext.Provider>
      </SafeScopeContext.Provider>,
    )

  it('should use useTrustedTokenBalances for token lookup', async () => {
    renderComponent()

    expect(useTrustedTokenBalancesSpy).toHaveBeenCalled()

    await waitFor(() => {
      expect(createMultiSendCallOnlyTxSpy).toHaveBeenCalled()
    })
  })

  it('should not build transaction when balances are loading', async () => {
    useTrustedTokenBalancesSpy.mockReturnValue([undefined, undefined, true])

    renderComponent()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(createMultiSendCallOnlyTxSpy).not.toHaveBeenCalled()
  })

  it('should build transaction when balances are available', async () => {
    renderComponent()

    await waitFor(() => {
      expect(createMultiSendCallOnlyTxSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            to: USDC_ADDRESS,
          }),
        ]),
        undefined,
      )
    })
  })

  it('should skip tokens not found in balances', async () => {
    const paramsWithUnknownToken: MultiTokenTransferParams = {
      ...mockParams,
      recipients: [{ ...mockParams.recipients[0], tokenAddress: '0x0000000000000000000000000000000000000001' }],
    }

    renderComponent(paramsWithUnknownToken)

    await waitFor(() => {
      expect(createMultiSendCallOnlyTxSpy).toHaveBeenCalledWith([], undefined)
    })
  })

  it('should set nonce when txNonce is provided', async () => {
    renderComponent(mockParams, 5)

    await waitFor(() => {
      expect(mockSetNonce).toHaveBeenCalledWith(5)
    })
  })

  describe('in a Safe scope', () => {
    const scopeTarget = () => ({ chainId: faker.string.numeric(5), safeAddress: faker.finance.ethereumAddress() })

    it('builds the transfer with the SDK of the Safe scope it is opened in', async () => {
      const context = safeScopeContextFor(scopeTarget())
      const scope = { ...context, scope: context.scope && { ...context.scope, sdk: {} as Safe } }

      renderComponent(mockParams, undefined, scope)

      await waitFor(() => {
        expect(createMultiSendCallOnlyTxSpy).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ to: USDC_ADDRESS })]),
          scope.scope,
        )
      })
    })

    it('waits for the scoped Safe SDK before building the transfer', async () => {
      renderComponent(mockParams, undefined, safeScopeContextFor(scopeTarget()))

      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(createMultiSendCallOnlyTxSpy).not.toHaveBeenCalled()
    })

    it('builds the transfer with the Safe in the URL outside a scope', async () => {
      renderComponent()

      await waitFor(() => {
        expect(createMultiSendCallOnlyTxSpy).toHaveBeenCalledWith(expect.any(Array), undefined)
      })
    })
  })
})
