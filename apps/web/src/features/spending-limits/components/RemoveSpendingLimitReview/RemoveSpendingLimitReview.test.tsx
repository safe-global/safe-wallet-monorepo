import type { ReactNode } from 'react'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { render, waitFor } from '@/tests/test-utils'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import * as useChainId from '@/hooks/useChainId'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { createTx } from '@/services/tx/tx-sender'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { safeTxContextBuilder } from '@/tests/builders/safeTxContext'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { getLatestSpendingLimitAddress } from '../../services/spendingLimitDeployments'
import { getSpendingLimitInterface } from '../../services/spendingLimitContracts'
import RemoveSpendingLimitReview from '.'

const SEPOLIA = '11155111'

jest.mock('@/services/tx/tx-sender', () => ({ createTx: jest.fn() }))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const mockCreateTx = jest.mocked(createTx)
const builtTx = safeTxBuilder().build()
const spendingLimitModule = getLatestSpendingLimitAddress(SEPOLIA)!

const givenSafeModules = (modules: string[]) => {
  const safe = extendedSafeInfoBuilder()
    .with({ chainId: SEPOLIA, modules: modules.map((value) => ({ value })) })
    .build()
  jest.spyOn(useSafeInfo, 'default').mockReturnValue({
    safe,
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  })
}

const decodeDeleteAllowance = ({ data }: MetaTransactionData) => {
  const [beneficiary, token] = getSpendingLimitInterface().decodeFunctionData('deleteAllowance', data)
  return { beneficiary, token }
}

const renderReview = () => {
  const context = safeTxContextBuilder().build()
  const limit = spendingLimitStateBuilder().build()
  render(
    <SafeTxContext.Provider value={context}>
      <RemoveSpendingLimitReview params={limit} onSubmit={jest.fn()} />
    </SafeTxContext.Provider>,
  )
  return { context, limit }
}

describe('RemoveSpendingLimitReview', () => {
  beforeEach(() => {
    jest.spyOn(useChainId, 'default').mockReturnValue(SEPOLIA)
    mockCreateTx.mockResolvedValue(builtTx)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockCreateTx.mockReset()
  })

  it('builds a deleteAllowance call for the beneficiary and token on the spending limit module', async () => {
    givenSafeModules([spendingLimitModule])

    const { context, limit } = renderReview()

    await waitFor(() => expect(context.setSafeTx).toHaveBeenCalledWith(builtTx))
    const [call] = mockCreateTx.mock.calls[0]
    expect(call.to).toBe(spendingLimitModule)
    expect(call.value).toBe('0')
    expect(decodeDeleteAllowance(call)).toEqual({ beneficiary: limit.beneficiary, token: limit.token.address })
  })

  it('builds no transaction when the Safe has no modules', () => {
    givenSafeModules([])

    renderReview()

    expect(mockCreateTx).not.toHaveBeenCalled()
  })

  it('reports an error when the transaction cannot be built', async () => {
    givenSafeModules([spendingLimitModule])
    const error = new Error('Cannot build transaction')
    mockCreateTx.mockRejectedValue(error)

    const { context } = renderReview()

    await waitFor(() => expect(context.setSafeTxError).toHaveBeenCalledWith(error))
  })
})
