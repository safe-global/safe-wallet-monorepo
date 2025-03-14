import { render, screen, waitFor } from '@testing-library/react'
import { SafenetSettlementLink } from './SafenetSettlementLink'
import { useChain } from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import {
  TransactionListItemType,
  TransactionInfoType,
  TransactionTokenType,
} from '@safe-global/safe-gateway-typescript-sdk'
import { type SafenetDebit } from '@/store/safenet'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { faker } from '@faker-js/faker'
import { getModuleTransactions } from '@safe-global/safe-gateway-typescript-sdk'

jest.mock('@/hooks/useChains')
jest.mock('@safe-global/safe-gateway-typescript-sdk')

describe('SafenetSettlementLink', () => {
  const mockUseChain = useChain as jest.Mock
  const mockGetModuleTransactions = getModuleTransactions as jest.Mock

  const debit: SafenetDebit = {
    chainId: 1,
    executionTxHash: '0x123',
    safe: faker.finance.ethereumAddress(),
    amount: '1000',
    feeAmount: '0',
    feeBeneficiary: ZERO_ADDRESS,
    status: 'EXECUTED',
    token: faker.finance.ethereumAddress(),
  }

  const chainConfig = {
    shortName: 'eth',
  }

  const moduleTxs = {
    results: [
      {
        type: TransactionListItemType.TRANSACTION,
        transaction: {
          id: '0x789',
          txInfo: {
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              type: TransactionTokenType.ERC20,
              value: '1000',
              tokenAddress: debit.token,
            },
          },
        },
      },
      {
        type: TransactionListItemType.TRANSACTION,
        transaction: {
          id: '0x987',
          txInfo: {
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              type: TransactionTokenType.ERC20,
              value: '0',
              tokenAddress: debit.token,
            },
          },
        },
      },
    ],
  }

  beforeEach(() => {
    mockUseChain.mockReturnValue(chainConfig)
    mockGetModuleTransactions.mockResolvedValue(moduleTxs)
  })

  it('should find and link to the correct settlement module transaction', async () => {
    render(<SafenetSettlementLink debit={debit} />)

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /view settlement/i })
      expect(link).toHaveAttribute('href', `${AppRoutes.transactions.tx}?safe=eth%3A${debit.safe}&id=0x789`)
    })
  })

  it('should return null if no chainConfig is found', async () => {
    mockUseChain.mockReturnValue(undefined)
    const { container } = render(<SafenetSettlementLink debit={debit} />)
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it('should return null if no module transactions are found', async () => {
    mockGetModuleTransactions.mockResolvedValue(undefined)
    const { container } = render(<SafenetSettlementLink debit={debit} />)

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it('should return null if debit has no executionTxHash', async () => {
    const debitWithoutTxHash = { ...debit, executionTxHash: undefined }
    const { container } = render(<SafenetSettlementLink debit={debitWithoutTxHash} />)

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it('should return null if no matching settlement transaction is found', async () => {
    const noMatchModuleTxs = {
      results: [
        {
          type: TransactionListItemType.TRANSACTION,
          transaction: {
            id: '0x789',
            txInfo: {
              type: TransactionInfoType.TRANSFER,
              transferInfo: {
                type: TransactionTokenType.ERC20,
                value: '2000',
                tokenAddress: debit.token,
              },
            },
          },
        },
        {
          type: TransactionListItemType.TRANSACTION,
          transaction: {
            id: '0x789',
            txInfo: {
              type: TransactionInfoType.TRANSFER,
              transferInfo: {
                type: TransactionTokenType.ERC20,
                value: '1000',
                tokenAddress: faker.finance.ethereumAddress(),
              },
            },
          },
        },
      ],
    }
    mockGetModuleTransactions.mockReturnValue(noMatchModuleTxs)
    const { container } = render(<SafenetSettlementLink debit={debit} />)

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })
})
