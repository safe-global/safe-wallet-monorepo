import React from 'react'
import { render, screen } from '@/tests/test-utils'
import { FormProvider, useForm, useFieldArray } from 'react-hook-form'
import TokenAmountInput from './index'
import { TokenAmountFields } from '@/components/tx-flow/flows/TokenTransfer/types'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TokenType } from '@safe-global/store/gateway/types'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const mockBalances: Balances['items'] = [
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
]

// Wrapper component to provide form context
const TestWrapper = ({
  defaultTokenAddress,
  balances = mockBalances,
  children,
}: {
  defaultTokenAddress: string
  balances?: Balances['items']
  children?: React.ReactNode
}) => {
  const methods = useForm({
    defaultValues: {
      [TokenAmountFields.tokenAddress]: defaultTokenAddress,
      [TokenAmountFields.amount]: '',
    },
  })

  const selectedToken = balances.find((b) => b.tokenInfo.address === defaultTokenAddress)

  return (
    <FormProvider {...methods}>
      <TokenAmountInput
        balances={balances}
        selectedToken={selectedToken}
        maxAmount={BigInt(selectedToken?.balance || '0')}
      />
      {children}
    </FormProvider>
  )
}

// Wrapper for field array scenario
const FieldArrayTestWrapper = ({
  defaultTokenAddress,
  balances = mockBalances,
}: {
  defaultTokenAddress: string
  balances?: Balances['items']
}) => {
  const methods = useForm({
    defaultValues: {
      recipients: [
        {
          recipient: '',
          [TokenAmountFields.tokenAddress]: defaultTokenAddress,
          [TokenAmountFields.amount]: '',
        },
      ],
    },
  })

  const selectedToken = balances.find((b) => b.tokenInfo.address === defaultTokenAddress)

  return (
    <FormProvider {...methods}>
      <TokenAmountInput
        balances={balances}
        selectedToken={selectedToken}
        maxAmount={BigInt(selectedToken?.balance || '0')}
        fieldArray={{ name: 'recipients', index: 0 }}
      />
    </FormProvider>
  )
}

// Wrapper that uses useFieldArray like CreateTokenTransfer does
const UseFieldArrayTestWrapper = ({
  defaultTokenAddress,
  balances = mockBalances,
}: {
  defaultTokenAddress: string
  balances?: Balances['items']
}) => {
  const methods = useForm({
    defaultValues: {
      recipients: [
        {
          recipient: '',
          [TokenAmountFields.tokenAddress]: defaultTokenAddress,
          [TokenAmountFields.amount]: '',
        },
      ],
    },
  })

  // This is what CreateTokenTransfer does
  const { fields } = useFieldArray({
    control: methods.control,
    name: 'recipients',
  })

  const selectedToken = balances.find((b) => b.tokenInfo.address === defaultTokenAddress)

  return (
    <FormProvider {...methods}>
      {fields.map((field, index) => (
        <TokenAmountInput
          key={field.id}
          balances={balances}
          selectedToken={selectedToken}
          maxAmount={BigInt(selectedToken?.balance || '0')}
          fieldArray={{ name: 'recipients', index }}
        />
      ))}
    </FormProvider>
  )
}

describe('TokenAmountInput', () => {
  describe('Token preselection without fieldArray', () => {
    it('should preselect ETH (ZERO_ADDRESS) by default', () => {
      render(<TestWrapper defaultTokenAddress={ZERO_ADDRESS} />)

      expect(screen.getByText('Ether')).toBeInTheDocument()
    })

    it('should preselect USDC when passed as default', () => {
      render(<TestWrapper defaultTokenAddress={USDC_ADDRESS} />)

      expect(screen.getByText('USD Coin')).toBeInTheDocument()
    })
  })

  describe('Token preselection with fieldArray', () => {
    it('should preselect ETH (ZERO_ADDRESS) in field array', () => {
      render(<FieldArrayTestWrapper defaultTokenAddress={ZERO_ADDRESS} />)

      expect(screen.getByText('Ether')).toBeInTheDocument()
    })

    it('should preselect USDC in field array when passed as default', () => {
      render(<FieldArrayTestWrapper defaultTokenAddress={USDC_ADDRESS} />)

      expect(screen.getByText('USD Coin')).toBeInTheDocument()
    })
  })

  describe('Token preselection with useFieldArray (like CreateTokenTransfer)', () => {
    it('should preselect ETH (ZERO_ADDRESS) with useFieldArray', () => {
      render(<UseFieldArrayTestWrapper defaultTokenAddress={ZERO_ADDRESS} />)

      const select = screen.getByTestId('token-selector')
      const input = select.querySelector('input')

      expect(screen.getByText('Ether')).toBeInTheDocument()
      expect(input?.value).toBe(ZERO_ADDRESS)
    })

    it('should preselect USDC with useFieldArray', () => {
      render(<UseFieldArrayTestWrapper defaultTokenAddress={USDC_ADDRESS} />)

      const select = screen.getByTestId('token-selector')
      const input = select.querySelector('input')

      expect(screen.getByText('USD Coin')).toBeInTheDocument()
      expect(input?.value).toBe(USDC_ADDRESS)
    })
  })

  describe('Token preselection when balances load after initial render', () => {
    // This simulates the real app where balances might be empty initially
    const DelayedBalancesWrapper = ({ defaultTokenAddress }: { defaultTokenAddress: string }) => {
      const [balances, setBalances] = React.useState<Balances['items']>([])

      // Simulate balances loading after component mounts
      React.useEffect(() => {
        setBalances(mockBalances)
      }, [])

      const methods = useForm({
        defaultValues: {
          recipients: [
            {
              recipient: '',
              [TokenAmountFields.tokenAddress]: defaultTokenAddress,
              [TokenAmountFields.amount]: '',
            },
          ],
        },
      })

      const { fields } = useFieldArray({
        control: methods.control,
        name: 'recipients',
      })

      const selectedToken = balances.find((b) => b.tokenInfo.address === defaultTokenAddress)

      return (
        <FormProvider {...methods}>
          {fields.map((field, index) => (
            <TokenAmountInput
              key={field.id}
              balances={balances}
              selectedToken={selectedToken}
              maxAmount={BigInt(selectedToken?.balance || '0')}
              fieldArray={{ name: 'recipients', index }}
            />
          ))}
        </FormProvider>
      )
    }

    it('should preselect USDC even when balances load after initial render', async () => {
      render(<DelayedBalancesWrapper defaultTokenAddress={USDC_ADDRESS} />)

      // Wait for balances to load
      await screen.findByText('USD Coin')

      const select = screen.getByTestId('token-selector')
      const input = select.querySelector('input')

      expect(input?.value).toBe(USDC_ADDRESS)
    })

    it('should NOT preselect ZERO_ADDRESS when USDC is passed', async () => {
      render(<DelayedBalancesWrapper defaultTokenAddress={USDC_ADDRESS} />)

      // Wait for balances to load
      await screen.findByText('USD Coin')

      const select = screen.getByTestId('token-selector')
      const input = select.querySelector('input')

      // This should fail if ZERO_ADDRESS is being selected instead of USDC
      expect(input?.value).not.toBe(ZERO_ADDRESS)
      expect(input?.value).toBe(USDC_ADDRESS)
    })
  })
})
