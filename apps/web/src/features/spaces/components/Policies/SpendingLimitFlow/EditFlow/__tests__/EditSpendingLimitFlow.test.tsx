import type { ReactNode } from 'react'
import { getAddress } from 'ethers'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { useExistingSpendingLimits } from '../../ExistingSpendingLimitsProvider'
import {
  useAddCustomToken as mockUseAddCustomToken,
  useCustomTokens as mockUseCustomTokens,
} from '@/features/spending-limits'
import { tokenOptionBuilder } from '@/tests/builders/tokenOptions'
import EditSpendingLimitFlow from '..'

const SAFE = getAddress('0x1000000000000000000000000000000000000001')
const ALICE = getAddress('0x00000000000000000000000000000000000000a1')
const USDC = getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')

jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
jest.mock('../../ExistingSpendingLimitsProvider', () => ({
  ExistingSpendingLimitsProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useExistingSpendingLimits: jest.fn(),
}))
jest.mock('@/components/tx-flow/TxFlow', () => ({
  TxFlow: jest.fn(() => {
    const addToken = mockUseAddCustomToken()
    const tokens = mockUseCustomTokens('11155111')
    return (
      <div data-testid="tx-flow">
        <button type="button" onClick={() => addToken('11155111', mockCustomToken)}>
          pick custom token
        </button>
        {tokens.map((token) => token.symbol).join(',')}
      </div>
    )
  }),
}))
jest.mock('../../CreateStep', () => ({ __esModule: true, default: () => <div /> }))
jest.mock('../../ReviewStep', () => ({ __esModule: true, default: () => <div /> }))

const mockCustomToken = tokenOptionBuilder().with({ group: 'custom', symbol: 'NEW' }).build()
const mockUseExisting = useExistingSpendingLimits as jest.MockedFunction<typeof useExistingSpendingLimits>
const mockTxFlow = TxFlow as unknown as jest.Mock

describe('EditSpendingLimitFlow', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not open the flow until the chain has answered', () => {
    mockUseExisting.mockReturnValue({ loading: true })

    render(<EditSpendingLimitFlow safe={{ chainId: '11155111', address: SAFE }} />)

    expect(screen.queryByTestId('tx-flow')).not.toBeInTheDocument()
    expect(mockTxFlow).not.toHaveBeenCalled()
  })

  it('keeps a token picked by address while the flow is open', async () => {
    mockUseExisting.mockReturnValue({ limits: [], loading: false })
    const { user } = renderWithUserEvent(<EditSpendingLimitFlow safe={{ chainId: '11155111', address: SAFE }} />)

    await user.click(screen.getByRole('button', { name: 'pick custom token' }))

    expect(screen.getByTestId('tx-flow')).toHaveTextContent(mockCustomToken.symbol)
  })

  it('seeds the flow with the limits the Safe already holds', () => {
    const limit = spendingLimitStateBuilder()
      .with({
        beneficiary: ALICE,
        amount: '100000000',
        resetTimeMin: '1440',
        token: { address: USDC, symbol: 'USDC', decimals: 6, logoUri: '' },
      })
      .build()
    mockUseExisting.mockReturnValue({ limits: [limit], loading: false })

    render(<EditSpendingLimitFlow safe={{ chainId: '11155111', address: SAFE }} />)

    expect(mockTxFlow.mock.calls[0][0].initialData).toEqual({
      safe: `11155111:${SAFE}`,
      spenders: [{ address: ALICE, limits: [{ tokenAddress: USDC, amount: '100', resetTime: '1440' }] }],
    })
  })
})
