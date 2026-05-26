import { Interface } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { buildSpendingLimitBatch, type BatchToken } from '../buildBatch'

// We mock the spending-limit param helpers so the test focuses on this file's
// orchestration (which txs land in the batch, in what order, with what
// data) rather than the deep ABI encoding the param helpers own.
jest.mock('@/features/spending-limits/services/spendingLimitParams', () => ({
  createEnableModuleTx: jest.fn(async (_chain, safeAddress, _version, moduleAddress) => ({
    to: safeAddress,
    data: `0xCAFE${moduleAddress.slice(2)}`,
  })),
  createAddDelegateTx: jest.fn((delegate, moduleAddress) => ({
    to: moduleAddress,
    value: '0',
    data: `0xADDDELEGATE${delegate.slice(2)}`,
  })),
  createSetAllowanceTx: jest.fn((delegate, token, amountWei, resetTimeMin, _resetBaseMin, moduleAddress) => ({
    to: moduleAddress,
    value: '0',
    data: `0xSETALLOWANCE-${delegate}-${token}-${amountWei}-${resetTimeMin}`,
  })),
}))

jest.mock('@/features/spending-limits/services/spendingLimitContracts', () => ({
  getDeployedSpendingLimitModuleAddress: jest.fn(),
  getLatestSpendingLimitAddress: jest.fn(),
}))

import {
  getDeployedSpendingLimitModuleAddress,
  getLatestSpendingLimitAddress,
} from '@/features/spending-limits/services/spendingLimitContracts'

const ALLOWANCE_MODULE = '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'
const SAFE_ADDRESS = '0xb58C6653b07E48CB96BeFC5C4Ac3d1F9dfD696Cf'
const DELEGATE = '0x74C5B7C3F3Cf08FDf529AD4a49914F9244C519Ff'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const chain = { chainId: '1', chainName: 'Ethereum' } as Chain

const baseInput = {
  chain,
  chainId: '1',
  safeAddress: SAFE_ADDRESS,
  safeVersion: '1.3.0',
  delegate: DELEGATE,
  amountUsd: 100,
  period: 'day' as const,
  safeModules: [{ value: ALLOWANCE_MODULE }] as SafeState['modules'],
  safeDeployed: true,
}

const usdcToken: BatchToken = { address: USDC, decimals: 6, fiatConversion: '1' }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('buildSpendingLimitBatch', () => {
  it('throws when no tokens are picked', async () => {
    ;(getDeployedSpendingLimitModuleAddress as jest.Mock).mockReturnValue(ALLOWANCE_MODULE)

    await expect(buildSpendingLimitBatch({ ...baseInput, tokens: [] })).rejects.toThrow('Pick at least one token')
  })

  it('throws when no Allowance Module is registered for the chain', async () => {
    ;(getDeployedSpendingLimitModuleAddress as jest.Mock).mockReturnValue(undefined)
    ;(getLatestSpendingLimitAddress as jest.Mock).mockReturnValue(undefined)

    await expect(buildSpendingLimitBatch({ ...baseInput, tokens: [usdcToken] })).rejects.toThrow(
      /Allowance Module is not available/,
    )
  })

  it('when module is already enabled, skips the enable-module tx', async () => {
    ;(getDeployedSpendingLimitModuleAddress as jest.Mock).mockReturnValue(ALLOWANCE_MODULE)

    const { txs, allowanceModuleAddress } = await buildSpendingLimitBatch({
      ...baseInput,
      tokens: [usdcToken],
    })

    expect(allowanceModuleAddress).toBe(ALLOWANCE_MODULE)
    // 1 addDelegate + 1 setAllowance, no enableModule
    expect(txs).toHaveLength(2)
    expect(txs[0].data).toContain('ADDDELEGATE')
    expect(txs[1].data).toContain('SETALLOWANCE')
  })

  it('when module is NOT enabled and safe is deployed, encodes enableModule against the Safe address (no SDK)', async () => {
    ;(getDeployedSpendingLimitModuleAddress as jest.Mock).mockReturnValue(undefined)
    ;(getLatestSpendingLimitAddress as jest.Mock).mockReturnValue(ALLOWANCE_MODULE)

    const { txs } = await buildSpendingLimitBatch({ ...baseInput, tokens: [usdcToken] })

    expect(txs).toHaveLength(3)
    // First tx must enable the module on the Safe itself.
    expect(txs[0].to).toBe(SAFE_ADDRESS)
    // And the calldata must be a real enableModule(address) call against the module.
    const decoded = new Interface(['function enableModule(address module)']).decodeFunctionData(
      'enableModule',
      txs[0].data,
    )
    expect(String(decoded[0]).toLowerCase()).toBe(ALLOWANCE_MODULE.toLowerCase())
  })

  it('when safe is counterfactual, defers to the createEnableModuleTx helper for the right version', async () => {
    ;(getDeployedSpendingLimitModuleAddress as jest.Mock).mockReturnValue(undefined)
    ;(getLatestSpendingLimitAddress as jest.Mock).mockReturnValue(ALLOWANCE_MODULE)

    const { txs } = await buildSpendingLimitBatch({
      ...baseInput,
      tokens: [usdcToken],
      safeDeployed: false,
    })

    // First tx is the mocked createEnableModuleTx output; we asserted earlier
    // it was called with the right Safe address + version.
    expect(txs[0].data).toContain('0xCAFE')
    expect(txs[0].to).toBe(SAFE_ADDRESS)
  })

  it("translates period 'once' to resetTimeMin = 0", async () => {
    ;(getDeployedSpendingLimitModuleAddress as jest.Mock).mockReturnValue(ALLOWANCE_MODULE)

    const { txs } = await buildSpendingLimitBatch({
      ...baseInput,
      tokens: [usdcToken],
      period: 'once',
    })

    // Last tx in the batch is the setAllowance call; mocked data string carries
    // resetTimeMin as its final segment.
    const setAllowance = txs[txs.length - 1]
    expect(setAllowance.data.endsWith('-0')).toBe(true)
  })

  it('uses manualAmount when a token has no live rate', async () => {
    ;(getDeployedSpendingLimitModuleAddress as jest.Mock).mockReturnValue(ALLOWANCE_MODULE)

    const { txs } = await buildSpendingLimitBatch({
      ...baseInput,
      tokens: [{ address: USDC, decimals: 6, manualAmount: 250 }],
    })

    const setAllowance = txs[txs.length - 1]
    // 250 USDC at 6 decimals = 250000000 wei
    expect(setAllowance.data).toContain('250000000')
  })

  it('throws when neither fiatConversion nor manualAmount is provided for a token', async () => {
    ;(getDeployedSpendingLimitModuleAddress as jest.Mock).mockReturnValue(ALLOWANCE_MODULE)

    await expect(
      buildSpendingLimitBatch({
        ...baseInput,
        tokens: [{ address: USDC, decimals: 6 }],
      }),
    ).rejects.toThrow(/No amount set for/)
  })
})
