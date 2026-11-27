import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { COULD_NOT_SUBMIT_RETRY_MESSAGE } from '@/components/tx/TxSubmitError'
import * as useBalances from '@/hooks/useBalances'
import * as useChains from '@/hooks/useChains'
import * as useWallet from '@/hooks/wallets/useWallet'
import { balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import { chainBuilder } from '@/tests/builders/chains'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { dispatchSpendingLimitTxExecution } from '../../services/spendingLimitExecution'
import ReviewSpendingLimitTx, { type TokenTransferParams } from '.'

const MAINNET = '1'

jest.mock('../../services/spendingLimitExecution', () => ({ dispatchSpendingLimitTxExecution: jest.fn() }))
jest.mock('../../hooks/useSpendingLimitGas', () => ({
  __esModule: true,
  default: () => ({ gasLimit: BigInt(100_000), gasLimitLoading: false }),
}))
jest.mock('@/hooks/useGasPrice', () => ({
  __esModule: true,
  default: () => [{ maxFeePerGas: BigInt(1e9), maxPriorityFeePerGas: BigInt(1e8) }, undefined, false],
}))
jest.mock('@/hooks/wallets/useOnboard', () => ({ __esModule: true, default: () => ({}) }))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactElement }) => children(true),
}))

const mockDispatchExecution = jest.mocked(dispatchSpendingLimitTxExecution)
const usdc = erc20TokenBuilder().with({ symbol: 'USDC', decimals: 6 }).build()
const beneficiary = connectedWalletBuilder().build()

const transfer: TokenTransferParams = {
  recipient: checksumAddress(faker.finance.ethereumAddress()),
  tokenAddress: usdc.address,
  amount: '1.5',
}

const renderReview = () => {
  const onSubmit = jest.fn()
  const txModal: TxModalContextType = { txFlow: undefined, setTxFlow: jest.fn(), setFullWidth: jest.fn() }
  const limit = spendingLimitStateBuilder().with({ beneficiary: beneficiary.address, token: usdc }).build()
  render(
    <TxModalContext.Provider value={txModal}>
      <ReviewSpendingLimitTx params={transfer} onSubmit={onSubmit} />
    </TxModalContext.Provider>,
    { initialReduxState: { spendingLimits: { data: [limit], loaded: true, loading: false } } },
  )
  return { onSubmit, setTxFlow: txModal.setTxFlow }
}

const clickExecute = () => fireEvent.click(screen.getByRole('button', { name: 'Execute' }))

describe('ReviewSpendingLimitTx', () => {
  beforeEach(() => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainId: MAINNET }).build())
    jest.spyOn(useWallet, 'default').mockReturnValue(beneficiary)
    jest.spyOn(useBalances, 'default').mockReturnValue({
      balances: { items: [balanceBuilder().with({ tokenInfo: usdc }).build()], fiatTotal: '0' },
      loaded: true,
      loading: false,
      error: undefined,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockDispatchExecution.mockReset()
  })

  it('shows the amount, token and recipient of the transfer', () => {
    renderReview()

    expect(screen.getByTestId('token-amount').textContent).toBe('1.5')
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText(transfer.recipient)).toBeInTheDocument()
    expect(screen.getByText(/Spending limit transactions only appear in the interface/)).toBeInTheDocument()
  })

  it('executes the transfer through the spending limit of the connected beneficiary', async () => {
    mockDispatchExecution.mockResolvedValue(faker.string.hexadecimal({ length: 64 }))
    const { onSubmit, setTxFlow } = renderReview()

    clickExecute()

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(mockDispatchExecution.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        token: usdc.address,
        to: transfer.recipient,
        amount: '1500000',
        delegate: beneficiary.address,
      }),
    )
    expect(setTxFlow).toHaveBeenCalledWith(undefined)
  })

  it('shows the error and keeps the flow open when the execution fails', async () => {
    mockDispatchExecution.mockRejectedValue(new Error('Network connection lost'))
    const { onSubmit } = renderReview()

    clickExecute()

    expect(await screen.findByText(COULD_NOT_SUBMIT_RETRY_MESSAGE)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Execute' })).toBeEnabled()
  })

  it('tells the user when they reject the execution in their wallet', async () => {
    const ethersRejection = Object.assign(new Error('user rejected action'), { code: 'ACTION_REJECTED' })
    mockDispatchExecution.mockRejectedValue(ethersRejection)
    renderReview()

    clickExecute()

    expect(await screen.findByText('User rejected signing.')).toBeInTheDocument()
  })
})
