import useDeployGasLimit from '../useDeployGasLimit'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as onboard from '@/hooks/wallets/useOnboard'
import * as useWallet from '@/hooks/wallets/useWallet'
import * as sdk from '@/services/tx/tx-sender/sdk'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import * as protocolKit from '@safe-global/protocol-kit'
import type Safe from '@safe-global/protocol-kit'

import { renderHook } from '@/tests/test-utils'
import type { CompatibilityFallbackHandlerContractImplementationType } from '@safe-global/protocol-kit'
import { waitFor } from '@testing-library/react'
import type { OnboardAPI } from '@web3-onboard/core'
import { faker } from '@faker-js/faker'
import type * as SafeDeploymentsModule from '@safe-global/safe-deployments'

const safeDeploymentsAccessors = jest.requireActual('@safe-global/safe-deployments/dist/accessors') as Pick<
  typeof SafeDeploymentsModule,
  'getSimulateTxAccessorDeployment'
>

jest.mock('@safe-global/protocol-kit', () => {
  const actual = jest.requireActual('@safe-global/protocol-kit')

  return {
    ...actual,
    estimateSafeDeploymentGas: jest.fn(actual.estimateSafeDeploymentGas),
    estimateTxBaseGas: jest.fn(actual.estimateTxBaseGas),
    estimateSafeTxGas: jest.fn(actual.estimateSafeTxGas),
    getCompatibilityFallbackHandlerContract: jest.fn(actual.getCompatibilityFallbackHandlerContract),
  }
})

describe('useDeployGasLimit hook', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(useWallet, 'default').mockReturnValue({} as ConnectedWallet)
  })

  it('returns undefined in onboard is not initialized', () => {
    jest.spyOn(onboard, 'default').mockReturnValue(undefined)
    const { result } = renderHook(() => useDeployGasLimit())

    expect(result.current.gasLimit).toBeUndefined()
  })

  it('returns undefined in there is no wallet connected', () => {
    jest.spyOn(useWallet, 'default').mockReturnValue(null)
    const { result } = renderHook(() => useDeployGasLimit())

    expect(result.current.gasLimit).toBeUndefined()
  })

  it('returns safe deployment gas estimation', async () => {
    const mockGas = '100'
    const mockOnboard = {} as OnboardAPI
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(sdk, 'getSafeSDKWithSigner').mockImplementation(jest.fn())
    const mockEstimateSafeDeploymentGas = protocolKit.estimateSafeDeploymentGas as jest.MockedFunction<
      typeof protocolKit.estimateSafeDeploymentGas
    >
    mockEstimateSafeDeploymentGas.mockResolvedValue(mockGas)

    const { result } = renderHook(() => useDeployGasLimit())

    await waitFor(() => {
      expect(mockEstimateSafeDeploymentGas).toHaveBeenCalled()
      expect(result.current.gasLimit?.safeDeploymentGas).toEqual(mockGas)
    })
  })

  it('does not estimate safeTxGas if there is no safeTx and returns 0 for them instead', async () => {
    const mockOnboard = {} as OnboardAPI
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(sdk, 'getSafeSDKWithSigner').mockImplementation(jest.fn())
    ;(
      protocolKit.estimateSafeDeploymentGas as jest.MockedFunction<typeof protocolKit.estimateSafeDeploymentGas>
    ).mockResolvedValue('100')

    const mockEstimateTxBaseGas = protocolKit.estimateTxBaseGas as jest.MockedFunction<
      typeof protocolKit.estimateTxBaseGas
    >
    const mockEstimateSafeTxGas = protocolKit.estimateSafeTxGas as jest.MockedFunction<
      typeof protocolKit.estimateSafeTxGas
    >

    const { result } = renderHook(() => useDeployGasLimit())

    await waitFor(() => {
      expect(mockEstimateTxBaseGas).not.toHaveBeenCalled()
      expect(mockEstimateSafeTxGas).not.toHaveBeenCalled()
      expect(result.current.gasLimit?.safeTxGas).toEqual(0n)
    })
  })

  it('returns the totalFee', async () => {
    const mockOnboard = {} as OnboardAPI
    jest.spyOn(onboard, 'default').mockReturnValue(mockOnboard)
    jest.spyOn(sdk, 'getSafeSDKWithSigner').mockResolvedValue({
      getThreshold: jest.fn(),
      getNonce: jest.fn(),
      getSafeProvider: () => ({
        estimateGas: () => Promise.resolve('420000'),
        getSignerAddress: () => Promise.resolve(faker.finance.ethereumAddress()),
      }),
      getChainId: jest.fn(),
      getContractManager: () =>
        ({
          contractNetworks: {},
        }) as any,
      getContractVersion: () => '1.3.0',
      createSafeDeploymentTransaction: () =>
        Promise.resolve({
          to: faker.finance.ethereumAddress(),
          value: '0',
          data: '0x1234',
        }),
      getAddress: () => Promise.resolve(faker.finance.ethereumAddress()),
      createTransactionBatch: () =>
        Promise.resolve({
          to: faker.finance.ethereumAddress(),
          value: '0',
          data: '0x2345',
        }),
    } as unknown as Safe)
    ;(
      protocolKit.getCompatibilityFallbackHandlerContract as jest.MockedFunction<
        typeof protocolKit.getCompatibilityFallbackHandlerContract
      >
    ).mockResolvedValue({
      encode: () => '0x3456',
    } as unknown as CompatibilityFallbackHandlerContractImplementationType)
    const getSimulateTxAccessorDeploymentSpy = jest
      .spyOn(safeDeploymentsAccessors, 'getSimulateTxAccessorDeployment')
      .mockReturnValue({
        defaultAddress: '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
      } as unknown as ReturnType<typeof safeDeploymentsAccessors.getSimulateTxAccessorDeployment>)
    ;(
      protocolKit.estimateSafeDeploymentGas as jest.MockedFunction<typeof protocolKit.estimateSafeDeploymentGas>
    ).mockResolvedValue('100')
    ;(protocolKit.estimateTxBaseGas as jest.MockedFunction<typeof protocolKit.estimateTxBaseGas>).mockResolvedValue(
      '21000',
    )

    const safeTx = safeTxBuilder().build()
    const { result } = renderHook(() => useDeployGasLimit(safeTx))

    await waitFor(() => {
      expect(result.current.gasLimit?.totalGas).toEqual(420000n + 21000n - 20000n)
    })

    getSimulateTxAccessorDeploymentSpy.mockRestore()
  })
})
