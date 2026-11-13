import type { SafeTransaction } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { mergePayFromSafeFeeParams } from '../mergePayFromSafeFeeParams'
import { createSafeTx } from '@/tests/builders/safeTx'
import type { AppDispatch } from '@/store'

const RELAY_FEE_RELAYER = {
  type: 'RELAY_FEE',
  safeCreationSponsored: false,
  safeTransactionSponsored: false,
  enableTenderlySimulationBeforeRelay: false,
  gasPaymentOptions: ['SUBSCRIPTION', 'PAY_FROM_SAFE'],
}

const buildChain = (features: string[], relayer: typeof RELAY_FEE_RELAYER | null = RELAY_FEE_RELAYER): Chain =>
  ({ chainId: '1', features, relayer }) as unknown as Chain

const buildFeature = (overrides: Partial<{ $isReady: boolean; resolveFeeParams: jest.Mock }> = {}) => ({
  $isReady: overrides.$isReady ?? true,
  resolveFeeParams: overrides.resolveFeeParams ?? jest.fn(),
})

const dispatch = jest.fn() as unknown as ReturnType<typeof jest.fn> & AppDispatch

const baseArgs = (safeTx: SafeTransaction) => ({
  safeTx,
  chain: buildChain([]),
  isPayFromSafe: true,
  feeGasToken: '0xtoken',
  chainId: '1',
  safeAddress: '0xsafe',
  numberSignatures: 2,
  dispatch,
})

describe('mergePayFromSafeFeeParams', () => {
  it('returns safeTx untouched when already signed (confirmer path)', async () => {
    const safeTx = createSafeTx()
    safeTx.signatures.set('0xowner', { signer: '0xowner', data: '0xsig' } as any)
    const feature = buildFeature()

    const result = await mergePayFromSafeFeeParams({ ...baseArgs(safeTx), feePaymentFeature: feature })

    expect(result).toEqual({ safeTx, feesMerged: false })
    expect(feature.resolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when the relayer does not offer Pay from Safe, whatever the flags', async () => {
    const safeTx = createSafeTx()
    const feature = buildFeature()

    const result = await mergePayFromSafeFeeParams({
      ...baseArgs(safeTx),
      chain: buildChain(['GTF', 'PAY_FROM_SAFE'], { ...RELAY_FEE_RELAYER, gasPaymentOptions: ['SUBSCRIPTION'] }),
      feePaymentFeature: feature,
    })

    expect(result).toEqual({ safeTx, feesMerged: false })
    expect(feature.resolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when the chain has no relayer', async () => {
    const safeTx = createSafeTx()
    const feature = buildFeature()

    const result = await mergePayFromSafeFeeParams({
      ...baseArgs(safeTx),
      chain: buildChain(['GTF'], null),
      feePaymentFeature: feature,
    })

    expect(result).toEqual({ safeTx, feesMerged: false })
    expect(feature.resolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when the signer pays', async () => {
    const safeTx = createSafeTx()
    const feature = buildFeature()

    const result = await mergePayFromSafeFeeParams({
      ...baseArgs(safeTx),
      isPayFromSafe: false,
      feePaymentFeature: feature,
    })

    expect(result).toEqual({ safeTx, feesMerged: false })
    expect(feature.resolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when no gas token is selected', async () => {
    const safeTx = createSafeTx()
    const feature = buildFeature()

    const result = await mergePayFromSafeFeeParams({
      ...baseArgs(safeTx),
      feeGasToken: undefined,
      feePaymentFeature: feature,
    })

    expect(result).toEqual({ safeTx, feesMerged: false })
    expect(feature.resolveFeeParams).not.toHaveBeenCalled()
  })

  it('bails out when feature is not ready', async () => {
    const safeTx = createSafeTx()
    const feature = buildFeature({ $isReady: false })

    const result = await mergePayFromSafeFeeParams({ ...baseArgs(safeTx), feePaymentFeature: feature })

    expect(result).toEqual({ safeTx, feesMerged: false })
    expect(feature.resolveFeeParams).not.toHaveBeenCalled()
  })

  it('forwards to resolveFeeParams on the happy path', async () => {
    const safeTx = createSafeTx()
    const merged = createSafeTx()
    const resolveFeeParams = jest.fn().mockResolvedValue(merged)
    const feature = buildFeature({ resolveFeeParams })

    const result = await mergePayFromSafeFeeParams({ ...baseArgs(safeTx), feePaymentFeature: feature })

    expect(result).toEqual({ safeTx: merged, feesMerged: true })
    expect(resolveFeeParams).toHaveBeenCalledWith({
      chainId: '1',
      safeAddress: '0xsafe',
      safeTx,
      gasToken: '0xtoken',
      numberSignatures: 2,
      dispatch,
    })
  })
})
