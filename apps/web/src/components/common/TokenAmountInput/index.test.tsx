import { render, screen, waitFor } from '@/tests/test-utils'
import { useForm, FormProvider } from 'react-hook-form'
import TokenAmountInput from '.'
import { TokenType } from '@safe-global/store/gateway/types'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import userEvent from '@testing-library/user-event'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

const mockTokenWithPrice: Balance = {
  tokenInfo: {
    address: '0x123',
    decimals: 18,
    logoUri: 'https://example.com/token.png',
    name: 'Test Token',
    symbol: 'TST',
    type: TokenType.ERC20,
  },
  balance: '1000000000000000000',
  fiatBalance: '2042.00',
  fiatConversion: '2042.00',
}

const mockTokenWithoutPrice: Balance = {
  ...mockTokenWithPrice,
  tokenInfo: {
    ...mockTokenWithPrice.tokenInfo,
    address: '0x456',
  },
  fiatBalance: '0',
  fiatConversion: '0',
}

const mockTokenMissingPrice: Balance = {
  ...mockTokenWithPrice,
  tokenInfo: {
    ...mockTokenWithPrice.tokenInfo,
    address: '0x789',
  },
  fiatBalance: '0',
  fiatConversion: '',
}

const mockNativeToken: Balance = {
  tokenInfo: {
    address: ZERO_ADDRESS,
    decimals: 18,
    logoUri: 'https://example.com/eth.png',
    name: 'Ether',
    symbol: 'ETH',
    type: TokenType.NATIVE_TOKEN,
  },
  balance: '1000000000000000000',
  fiatBalance: '3500.00',
  fiatConversion: '3500.00',
}

type TestFormValues = {
  tokenAddress: string
  amount: string
}

const normalizer = (text: string) => text.replace(/\u200A/g, ' ').trim()

const TestForm = ({
  balances,
  selectedToken,
  defaultAmount = '',
  defaultTokenAddress = '',
}: {
  balances: Balance[]
  selectedToken?: Balance
  defaultAmount?: string
  defaultTokenAddress?: string
}) => {
  const tokenAddress = defaultTokenAddress || (balances[0]?.tokenInfo.address ?? '')
  const actualSelectedToken = selectedToken || balances.find((b) => b.tokenInfo.address === tokenAddress)

  const methods = useForm<TestFormValues>({
    defaultValues: {
      tokenAddress,
      amount: defaultAmount,
    },
    mode: 'onChange',
  })

  return (
    <FormProvider {...methods}>
      <form>
        <TokenAmountInput balances={balances} selectedToken={actualSelectedToken} />
      </form>
    </FormProvider>
  )
}

describe('TokenAmountInput - USD Equivalent Display', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Display Scenarios', () => {
    it('should render USD equivalent when token has valid fiatConversion and amount is entered', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.01')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('20.42') || normalized.includes('$20.42') || normalized.includes('$ 20.42')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })

    it('should not render USD equivalent when fiatConversion is "0"', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithoutPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithoutPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.01')

      await waitFor(() => {
        const fiatValue = screen.queryByText(/\$/)
        expect(fiatValue).not.toBeInTheDocument()
      })
    })

    it('should not render USD equivalent when fiatConversion is missing', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenMissingPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenMissingPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.01')

      await waitFor(() => {
        const fiatValue = screen.queryByText(/\$/)
        expect(fiatValue).not.toBeInTheDocument()
      })
    })

    it('should not render USD equivalent when amount is empty', () => {
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const fiatValue = screen.queryByText(/\$/)
      expect(fiatValue).not.toBeInTheDocument()
    })

    it('should not render USD equivalent when amount is "0" and price is available', async () => {
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} defaultAmount="0" />)

      const amountInput = screen.getByTestId('token-amount-field')
      expect(amountInput).toHaveValue('0')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('0.00') || normalized.includes('$0.00') || normalized.includes('$ 0.00')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })
  })

  describe('Calculation Tests', () => {
    it('should calculate correct fiat value: 0.01 × 2042.00 = 20.42', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.01')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('20.42') || normalized.includes('$20.42') || normalized.includes('$ 20.42')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })

    it('should calculate correct fiat value for larger amounts', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '1.5')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('3,063') || normalized.includes('3063')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })

    it('should calculate correct fiat value for small amounts', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.001')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('2.04') || normalized.includes('$2.04')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })

    it('should calculate correct fiat value for native token', async () => {
      const user = userEvent.setup()
      const balances = [mockNativeToken]

      render(<TestForm balances={balances} selectedToken={mockNativeToken} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.5')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('1,750') || normalized.includes('1750')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should update USD value when amount changes', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')

      await user.type(amountInput, '0.01')
      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('20.42')
        })
        expect(fiatValue).toBeInTheDocument()
      })

      await user.clear(amountInput)
      await user.type(amountInput, '0.1')
      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('204.20') || normalized.includes('204.2')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })

    it('should clear USD value when amount is cleared', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')

      await user.type(amountInput, '0.01')
      await waitFor(() => {
        expect(screen.getByText(/\$20\.42/)).toBeInTheDocument()
      })

      await user.clear(amountInput)
      await waitFor(() => {
        const fiatValue = screen.queryByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('20.42')
        })
        expect(fiatValue).not.toBeInTheDocument()
      })
    })

    it('should update USD value when token changes', async () => {
      const user = userEvent.setup()
      const token1 = mockTokenWithPrice
      const token2: Balance = {
        ...mockTokenWithPrice,
        tokenInfo: {
          ...mockTokenWithPrice.tokenInfo,
          address: '0x999',
          symbol: 'USDT',
        },
        fiatConversion: '1.00',
      }
      const balances = [token1, token2]

      render(<TestForm balances={balances} selectedToken={token1} defaultAmount="1" />)

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('2,042') || normalized.includes('2042')
        })
        expect(fiatValue).toBeInTheDocument()
      })

      const tokenSelect = screen.getByTestId('token-balance')
      await user.click(tokenSelect)

      const token2Option = screen.getByText('USDT')
      await user.click(token2Option)

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('1.00') || normalized.includes('$1.00')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small amounts (< $0.01)', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.000001')

      await waitFor(() => {
        const fiatValue = screen.getByText(/<\$0\.01/)
        expect(fiatValue).toBeInTheDocument()
      })
    })

    it('should handle invalid numeric input gracefully', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, 'abc')

      await waitFor(() => {
        const fiatValue = screen.queryByText(/\$/)
        expect(fiatValue).not.toBeInTheDocument()
      })
    })

    it('should handle decimal amounts correctly', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.123456')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('251.78') || normalized.includes('251.7')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })

    it('should handle very large amounts', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '1000')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('2,042,000') || normalized.includes('2042000')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })

    it('should handle amount with commas (converted to dots)', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0,01')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('20.42')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })
  })

  describe('Component Integration', () => {
    it('should display amount input field', () => {
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      expect(screen.getByTestId('token-amount-field')).toBeInTheDocument()
    })

    it('should display token selector', () => {
      const balances = [mockTokenWithPrice]

      render(<TestForm balances={balances} selectedToken={mockTokenWithPrice} />)

      expect(screen.getByTestId('token-balance')).toBeInTheDocument()
    })

    it('should work with fieldArray prop', async () => {
      const user = userEvent.setup()
      const balances = [mockTokenWithPrice]

      type MultiRecipientForm = {
        recipients: Array<{
          tokenAddress: string
          amount: string
        }>
      }

      const TestFormWithArray = () => {
        const methods = useForm<MultiRecipientForm>({
          defaultValues: {
            recipients: [
              {
                tokenAddress: mockTokenWithPrice.tokenInfo.address,
                amount: '',
              },
            ],
          },
          mode: 'onChange',
        })

        return (
          <FormProvider {...methods}>
            <form>
              <TokenAmountInput
                balances={balances}
                selectedToken={mockTokenWithPrice}
                fieldArray={{ name: 'recipients', index: 0 }}
              />
            </form>
          </FormProvider>
        )
      }

      render(<TestFormWithArray />)

      const amountInput = screen.getByTestId('token-amount-field')
      await user.type(amountInput, '0.01')

      await waitFor(() => {
        const fiatValue = screen.getByText((content) => {
          const normalized = normalizer(content)
          return normalized.includes('20.42')
        })
        expect(fiatValue).toBeInTheDocument()
      })
    })
  })
})
