import type { SafeTransaction } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { mergePayFromSafeFeeParams } from '../mergePayFromSafeFeeParams'
import { resolveFeeParams } from '../../../services/resolveFeeParams'
import { createSafeTx } from '@/tests/builders/safeTx'
import type { AppDispatch } from '@/store'

jest.mock('../../../services/resolveFeeParams', () => ({ resolveFeeParams: jest.fn() }))

const mockResolveFeeParams = resolveFeeParams as jest.MockedFunction<typeof resolveFeeParams>

const RELAY_FEE_RELAYER = {
  type: 'RELAY_FEE',
  safeCreationSponsored: false,
  safeTransactionSponsored: false,
  enableTenderlySimulationBeforeRelay: false,
  gasPaymentOptions: ['SUBSCRIPTION'],
}

const buildChain = (features: string[], relayer: typeof RELAY_FEE_RELAYER | null = RELAY_FEE_RELAYER): Chain =>
  ({ chainId: '1', features, relayer }) as unknown as Chain

const dispatch = jest.fn() as unknown as ReturnType<typeof jest.fn> & AppDispatch

const baseArgs = (safeTx: SafeTransaction) => ({
  safeTx,
  chain: buildChain(['GTF']),
  feePaymentMode: 'safe' as const,
  feeGasToken: '0xtoken',
  chainId: '1',
  safeAddress: '0xsafe',
  numberSignatures: 2,
  dispatch,
})

describe('mergePayFromSafeFeeParams', () => {
  beforeEach(() => {
    mockResolveFeeParams.mockReset()
  })

  it('returns safeTx untouched when already signed (confirmer path)', async () => {
    const safeTx = createSafeTx()
    safeTx.signatures.set('0xowner', { signer: '0xowner', data: '0xsig' } as any)

    const result = await mergePayFromSafeFeeParams({ ...baseArgs(safeTx) })

    expect(result).toBe(safeTx)
    expect(mockResolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when chain lacks the GTF feature', async () => {
    const safeTx = createSafeTx()

    const result = await mergePayFromSafeFeeParams({
      ...baseArgs(safeTx),
      chain: buildChain([]),
    })

    expect(result).toBe(safeTx)
    expect(mockResolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when the chain has the GTF flag but no RELAY_FEE relayer', async () => {
    const safeTx = createSafeTx()

    const result = await mergePayFromSafeFeeParams({
      ...baseArgs(safeTx),
      chain: buildChain(['GTF'], null),
    })

    expect(result).toBe(safeTx)
    expect(mockResolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when payment mode is signer', async () => {
    const safeTx = createSafeTx()

    const result = await mergePayFromSafeFeeParams({
      ...baseArgs(safeTx),
      feePaymentMode: 'signer',
    })

    expect(result).toBe(safeTx)
    expect(mockResolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when no gas token is selected', async () => {
    const safeTx = createSafeTx()

    const result = await mergePayFromSafeFeeParams({
      ...baseArgs(safeTx),
      feeGasToken: undefined,
    })

    expect(result).toBe(safeTx)
    expect(mockResolveFeeParams).not.toHaveBeenCalled()
  })

  it('forwards to resolveFeeParams on the happy path', async () => {
    const safeTx = createSafeTx()
    const merged = createSafeTx()
    mockResolveFeeParams.mockResolvedValue(merged)

    const result = await mergePayFromSafeFeeParams({ ...baseArgs(safeTx) })

    expect(result).toBe(merged)
    expect(mockResolveFeeParams).toHaveBeenCalledWith({
      chainId: '1',
      safeAddress: '0xsafe',
      safeTx,
      gasToken: '0xtoken',
      numberSignatures: 2,
      dispatch,
    })
  })
})
