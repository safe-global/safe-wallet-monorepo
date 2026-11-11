import { act, renderHook } from '@/tests/test-utils'
import { createMockSafeTransaction } from '@/tests/transactions'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { AdvancedParameters } from '@safe-global/views/components/tx/AdvancedParams/types'
import type { FeePayerView, GasFeeDetails } from '@safe-global/views/features/fee-payment/types'
import { useGasFeeDetails } from '../useGasFeeDetails'
import type { GasPayerSelection } from '../useGasPayerSelection'

const mockIsEIP1559 = jest.fn(() => true)

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '1', features: [], nativeCurrency: { symbol: 'ETH', decimals: 18 } }),
  useHasFeature: () => mockIsEIP1559(),
}))

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const GWEI = 1_000_000_000n

const estimate: AdvancedParameters = {
  userNonce: 12,
  gasLimit: 100_000n,
  maxPriorityFeePerGas: GWEI,
  maxFeePerGas: 2n * GWEI,
}

const baseView: FeePayerView = {
  payer: { kind: 'choice', value: 'WALLET', options: ['PAY_FROM_SAFE', 'WALLET'] },
  gasToken: { tokens: [], selected: ZERO_ADDRESS, locked: true },
  executionFee: {},
  gasFee: { note: 'Calculated at execution' },
  sponsored: false,
  sponsorKind: 'plan',
  footer: { kind: 'none' },
}

const buildSelection = (overrides: Partial<GasPayerSelection> = {}): GasPayerSelection =>
  ({
    view: baseView,
    choice: 'WALLET',
    setChoice: jest.fn(),
    isLocked: false,
    isPayFromSafe: false,
    isQuoteLoading: false,
    hasQuoteError: false,
    planState: 'FREE',
    fees: {},
    ...overrides,
  }) as GasPayerSelection

const renderDetails = (props: Partial<Parameters<typeof useGasFeeDetails>[0]> = {}) => {
  const onParamsChange = jest.fn()
  const hook = renderHook(() =>
    useGasFeeDetails({
      selection: buildSelection(),
      params: estimate,
      estimate,
      onParamsChange,
      ...props,
    }),
  )
  return { ...hook, onParamsChange }
}

const asEdit = (details?: GasFeeDetails) => details as Extract<GasFeeDetails, { mode: 'edit' }>
const asView = (details?: GasFeeDetails) => details as Extract<GasFeeDetails, { mode: 'view' }>

describe('useGasFeeDetails', () => {
  beforeEach(() => mockIsEIP1559.mockReturnValue(true))

  it('prices the gas fee with the settings the signer will submit', () => {
    const { result } = renderDetails({ params: { ...estimate, gasLimit: 200_000n } })

    expect(result.current.selection.view?.gasFee).toEqual({ amount: '0.0004', currency: 'ETH' })
  })

  it('lets the signer wallet edit the settings, closed by default', () => {
    const { result } = renderDetails()

    expect(result.current.gasFeeDetails).toMatchObject({ mode: 'edit', open: false })
  })

  it('opens the editor with the current values and saves the edits', () => {
    const { result, onParamsChange } = renderDetails()

    act(() => result.current.gasFeeDetails?.onOpenChange(true))
    const editor = asEdit(result.current.gasFeeDetails)
    expect(editor.open).toBe(true)
    expect(editor.fields.map(({ name, value }) => [name, value])).toEqual([
      ['userNonce', '12'],
      ['gasLimit', '100000'],
      ['maxPriorityFeePerGas', '1'],
      ['maxFeePerGas', '2'],
    ])

    act(() => asEdit(result.current.gasFeeDetails).onFieldChange('gasLimit', '150000'))
    expect(asEdit(result.current.gasFeeDetails).onReset).toBeDefined()

    act(() => asEdit(result.current.gasFeeDetails).onSave())
    expect(onParamsChange).toHaveBeenCalledWith({ ...estimate, gasLimit: 150_000n })
    expect(result.current.gasFeeDetails?.open).toBe(false)
  })

  it('goes back to the live estimate when the estimate is saved unchanged', () => {
    const { result, onParamsChange } = renderDetails({ params: { ...estimate, gasLimit: 150_000n } })

    act(() => result.current.gasFeeDetails?.onOpenChange(true))
    act(() => asEdit(result.current.gasFeeDetails).onReset?.())
    act(() => asEdit(result.current.gasFeeDetails).onSave())

    expect(onParamsChange).toHaveBeenCalledWith(undefined)
  })

  it('blocks saving invalid values', () => {
    const { result, onParamsChange } = renderDetails()

    act(() => result.current.gasFeeDetails?.onOpenChange(true))
    act(() => asEdit(result.current.gasFeeDetails).onFieldChange('gasLimit', '100'))

    const editor = asEdit(result.current.gasFeeDetails)
    expect(editor.canSave).toBe(false)
    expect(editor.fields.find((f) => f.name === 'gasLimit')?.error).toBe('BELOW_MIN_GAS_LIMIT')
    act(() => editor.onSave())
    expect(onParamsChange).not.toHaveBeenCalled()
  })

  it('opens the editor by itself when the gas cannot be estimated', () => {
    const { result } = renderDetails({
      params: { ...estimate, gasLimit: undefined },
      estimate: { ...estimate, gasLimit: undefined },
      gasLimitError: new Error('cannot estimate'),
    })

    const editor = asEdit(result.current.gasFeeDetails)
    expect(editor.open).toBe(true)
    expect(editor.fields.find((f) => f.name === 'gasLimit')).toMatchObject({ autoFocus: true, error: 'REQUIRED' })
    expect(result.current.selection.view?.gasFee).toEqual({ error: true })
  })

  it('labels the max fee as gas price without EIP-1559', () => {
    mockIsEIP1559.mockReturnValue(false)
    const { result } = renderDetails()

    act(() => result.current.gasFeeDetails?.onOpenChange(true))

    expect(asEdit(result.current.gasFeeDetails).fields.map((f) => f.name)).toEqual([
      'userNonce',
      'gasLimit',
      'gasPrice',
    ])
  })

  it('shows the Safe-pays quote read-only and keeps its fee', () => {
    const safeFee = { amount: '0.0002', currency: 'ETH' }
    const previewedSafeTx = {
      data: {
        ...createMockSafeTransaction({ to: ZERO_ADDRESS, data: '0x' }).data,
        safeTxGas: '80000',
        baseGas: '20000',
        gasPrice: '2000000000',
      },
      signatures: new Map(),
    }
    const { result } = renderDetails({
      selection: buildSelection({
        view: { ...baseView, payer: { kind: 'locked', value: 'PAY_FROM_SAFE' }, gasFee: safeFee },
        isPayFromSafe: true,
        fees: { previewedSafeTx } as GasPayerSelection['fees'],
      }),
    })

    const details = asView(result.current.gasFeeDetails)
    expect(details).toMatchObject({ mode: 'view', reason: 'PAID_FROM_SAFE' })
    expect(details.rows).toEqual([
      { name: 'gasLimit', value: '100000' },
      { name: 'gasPrice', value: '2' },
      { name: 'refundReceiver' },
    ])
    expect(result.current.selection.view?.gasFee).toBe(safeFee)
  })

  it('shows the settings read-only when the Pro plan pays', () => {
    const { result } = renderDetails({
      selection: buildSelection({
        view: {
          ...baseView,
          payer: { kind: 'choice', value: 'SPONSORED', options: ['SPONSORED', 'WALLET'] },
          sponsored: true,
        },
      }),
    })

    expect(result.current.gasFeeDetails).toMatchObject({ mode: 'view', reason: 'SPONSORED_PLAN' })
  })
})
