import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { parseUnits } from 'ethers'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { MultiTransfersFields, TokenTransferType } from '@/components/tx-flow/flows/TokenTransfer'
import * as useHasPermission from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { erc20TokenBuilder } from '@/tests/builders/balances'
import { safeTxContextBuilder } from '@/tests/builders/safeTxContext'
import SpendingLimitRow from '.'

const usdc = erc20TokenBuilder().with({ symbol: 'USDC', decimals: 6 }).build()

const FormWrapper = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: { [MultiTransfersFields.type]: TokenTransferType.multiSig } })
  return <FormProvider {...methods}>{children}</FormProvider>
}

const givenPermissions = ({ standard, spendingLimit }: { standard: boolean; spendingLimit: boolean }) => {
  jest.spyOn(useHasPermission, 'useHasPermission').mockImplementation((...args) => {
    const [permission] = args
    if (permission === Permission.CreateTransaction) return standard
    if (permission === Permission.CreateSpendingLimitTransaction) return spendingLimit
    return false
  })
}

const renderRow = (availableAmount: bigint) => {
  const context = safeTxContextBuilder().build()
  render(
    <SafeTxContext.Provider value={context}>
      <FormWrapper>
        <SpendingLimitRow availableAmount={availableAmount} selectedToken={usdc} />
      </FormWrapper>
    </SafeTxContext.Provider>,
  )
  return context
}

describe('SpendingLimitRow', () => {
  beforeEach(() => {
    givenPermissions({ standard: true, spendingLimit: true })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows the amount left on the spending limit with the token symbol', () => {
    renderRow(parseUnits('2.5', usdc.decimals))

    expect(screen.getByTestId('spending-limit-tx')).toHaveTextContent('Spending limit (2.5 USDC)')
  })

  it('shows 0 when the spending limit is used up', () => {
    renderRow(0n)

    expect(screen.getByTestId('spending-limit-tx')).toHaveTextContent('Spending limit (0 USDC)')
  })

  it('offers a standard and a spending limit transaction to an owner who is also a beneficiary', () => {
    renderRow(parseUnits('2.5', usdc.decimals))

    expect(screen.getByTestId('standard-tx')).toHaveTextContent('Standard transaction')
    expect(screen.getByTestId('spending-limit-tx')).toBeInTheDocument()
  })

  it('offers only the spending limit transaction to a beneficiary who is not an owner', () => {
    givenPermissions({ standard: false, spendingLimit: true })

    renderRow(parseUnits('2.5', usdc.decimals))

    expect(screen.queryByTestId('standard-tx')).not.toBeInTheDocument()
    expect(screen.getByTestId('spending-limit-tx')).toBeInTheDocument()
  })

  it('needs no nonce for a spending limit transaction, and needs one again for a standard transaction', () => {
    const { setNonceNeeded } = renderRow(parseUnits('2.5', usdc.decimals))

    fireEvent.click(within(screen.getByTestId('spending-limit-tx')).getByRole('radio'))
    expect(setNonceNeeded).toHaveBeenLastCalledWith(false)

    fireEvent.click(within(screen.getByTestId('standard-tx')).getByRole('radio'))
    expect(setNonceNeeded).toHaveBeenLastCalledWith(true)
  })
})
