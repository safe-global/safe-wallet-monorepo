import { fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { SAFE_CREATION_DATA_ERRORS, useSafeCreationData } from '../useSafeCreationData'
import { faker } from '@faker-js/faker'
import { PendingSafeStatus, type UndeployedSafe } from '@/store/slices'
import { PayMethod } from '@/features/counterfactual/PayNowPayLater'
import { chainBuilder } from '@/tests/builders/chains'
import * as sdk from '@/services/tx/tx-sender/sdk'
import * as cgwSdk from '@safe-global/safe-client-gateway-sdk'
import * as web3 from '@/hooks/wallets/web3'
import { encodeMultiSendData, type SafeProvider } from '@safe-global/protocol-kit'
import { Safe__factory, Safe_proxy_factory__factory } from '@safe-global/utils/types/contracts'
import { type JsonRpcProvider } from 'ethers'
import { Multi_send__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { getSafeSingletonDeployment, getSafeToL2SetupDeployment } from '@safe-global/safe-deployments'

const setupToL2Address = getSafeToL2SetupDeployment({ version: '1.4.1' })?.defaultAddress!

describe('useSafeCreationData', () => {
  beforeAll(() => {
    jest.spyOn(sdk, 'getSafeProvider').mockReturnValue({
      getChainId: jest.fn().mockReturnValue('1'),
      getExternalProvider: jest.fn(),
      getExternalSigner: jest.fn(),
    } as unknown as SafeProvider)
  })
  it('should return undefined without chain info', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos: ChainInfo[] = []
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))
    await waitFor(async () => {
      await Promise.resolve()
      expect(result.current).toEqual([undefined, undefined, false])
    })
  })

  it('should return the replayedSafe when copying one', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1' }).build()]
    const undeployedSafe: UndeployedSafe = {
      props: {
        factoryAddress: faker.finance.ethereumAddress(),
        saltNonce: '420',
        masterCopy: faker.finance.ethereumAddress(),
        safeVersion: '1.3.0',
        safeAccountConfig: {
          owners: [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
          threshold: 1,
          data: faker.string.hexadecimal({ length: 64 }),
          to: setupToL2Address,
          fallbackHandler: faker.finance.ethereumAddress(),
          payment: 0,
          paymentToken: ZERO_ADDRESS,
          paymentReceiver: ZERO_ADDRESS,
        },
      },
      status: {
        status: PendingSafeStatus.AWAITING_EXECUTION,
        type: PayMethod.PayLater,
      },
    }

    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos), {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            [safeAddress]: undeployedSafe,
          },
        },
      },
    })
    await waitFor(async () => {
      await Promise.resolve()
      expect(result.current).toEqual([undeployedSafe.props, undefined, false])
    })
  })

  it('should work for replayedSafe without payment info', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1' }).build()]
    const undeployedSafe: UndeployedSafe = {
      props: {
        factoryAddress: faker.finance.ethereumAddress(),
        saltNonce: '420',
        masterCopy: faker.finance.ethereumAddress(),
        safeVersion: '1.3.0',
        safeAccountConfig: {
          owners: [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
          threshold: 1,
          data: faker.string.hexadecimal({ length: 64 }),
          to: setupToL2Address,
          fallbackHandler: faker.finance.ethereumAddress(),
          paymentReceiver: ZERO_ADDRESS,
        },
      },
      status: {
        status: PendingSafeStatus.AWAITING_EXECUTION,
        type: PayMethod.PayLater,
      },
    }

    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos), {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            [safeAddress]: undeployedSafe,
          },
        },
      },
    })
    await waitFor(async () => {
      await Promise.resolve()
      expect(result.current).toEqual([
        {
          ...undeployedSafe.props,
          safeAccountConfig: { ...undeployedSafe.props.safeAccountConfig },
        },
        undefined,
        false,
      ])
    })
  })

  it('should return undefined without chain info', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos: ChainInfo[] = []
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))
    await waitFor(async () => {
      await Promise.resolve()
      expect(result.current).toEqual([undefined, undefined, false])
    })
  })

  it('should throw an error for replayed Safe it uses a unknown to address', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1' }).build()]
    const undeployedSafe: UndeployedSafe = {
      props: {
        factoryAddress: faker.finance.ethereumAddress(),
        saltNonce: '420',
        masterCopy: faker.finance.ethereumAddress(),
        safeVersion: '1.3.0',
        safeAccountConfig: {
          owners: [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
          threshold: 1,
          data: faker.string.hexadecimal({ length: 64 }),
          to: faker.finance.ethereumAddress(),
          fallbackHandler: faker.finance.ethereumAddress(),
          payment: 0,
          paymentToken: ZERO_ADDRESS,
          paymentReceiver: ZERO_ADDRESS,
        },
      },
      status: {
        status: PendingSafeStatus.AWAITING_EXECUTION,
        type: PayMethod.PayLater,
      },
    }

    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos), {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            [safeAddress]: undeployedSafe,
          },
        },
      },
    })
    await waitFor(async () => {
      await Promise.resolve()
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.UNKNOWN_SETUP_MODULES), false])
    })
  })

  it('should throw an error for legacy counterfactual Safes', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]
    const undeployedSafe = {
      props: {
        safeAccountConfig: {
          owners: [faker.finance.ethereumAddress()],
          threshold: 1,
        },
        safeDeploymentConfig: {
          saltNonce: '69',
          safeVersion: '1.3.0',
        },
      },
      status: {
        status: PendingSafeStatus.AWAITING_EXECUTION,
        type: PayMethod.PayLater,
      },
    }

    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos), {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            [safeAddress]: undeployedSafe as UndeployedSafe,
          },
        },
      },
    })

    await waitFor(async () => {
      await Promise.resolve()
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.LEGACY_COUNTERFATUAL), false])
    })
  })

  it('should throw an error if creation data cannot be found', async () => {
    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue(undefined as any)

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.NO_CREATION_DATA), false])
    })
  })

  it('should throw an error if Safe creation data is incomplete', async () => {
    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: faker.finance.ethereumAddress(),
      transactionHash: faker.string.hexadecimal({ length: 64 }),
      masterCopy: null,
      setupData: null,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.NO_CREATION_DATA), false])
    })
  })

  it('should throw an error if Safe setupData is empty', async () => {
    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: faker.finance.ethereumAddress(),
      transactionHash: faker.string.hexadecimal({ length: 64 }),
      masterCopy: faker.finance.ethereumAddress(),
      setupData: '0x',
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.NO_CREATION_DATA), false])
    })
  })

  it('should throw an error if outdated masterCopy is being used', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      setupToL2Address,
      faker.string.hexadecimal({ length: 64 }),
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
      0,
      faker.finance.ethereumAddress(),
    ])

    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: faker.finance.ethereumAddress(),
      transactionHash: faker.string.hexadecimal({ length: 64 }),
      masterCopy: getSafeSingletonDeployment({ version: '1.1.1' })?.defaultAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([
        undefined,
        new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_IMPLEMENTATION),
        false,
      ])
    })
  })

  it('should throw an error if unknown masterCopy is being used', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      ZERO_ADDRESS,
      EMPTY_DATA,
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
      0,
      faker.finance.ethereumAddress(),
    ])

    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: faker.finance.ethereumAddress(),
      transactionHash: faker.string.hexadecimal({ length: 64 }),
      masterCopy: faker.finance.ethereumAddress(),
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([
        undefined,
        new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_IMPLEMENTATION),
        false,
      ])
    })
  })

  it('should throw an error if the Safe creation uses reimbursement', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      setupToL2Address,
      faker.string.hexadecimal({ length: 64 }),
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
      420,
      faker.finance.ethereumAddress(),
    ])

    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: faker.finance.ethereumAddress(),
      transactionHash: faker.string.hexadecimal({ length: 64 }),
      masterCopy: getSafeSingletonDeployment({ version: '1.3.0' })?.defaultAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.PAYMENT_SAFE), false])
    })
  })

  it('should throw an error if the Safe creation uses an unknown setupModules call', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      faker.finance.ethereumAddress(),
      faker.string.hexadecimal({ length: 64 }),
      faker.finance.ethereumAddress(),
      ZERO_ADDRESS,
      0,
      faker.finance.ethereumAddress(),
    ])

    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: faker.finance.ethereumAddress(),
      transactionHash: faker.string.hexadecimal({ length: 64 }),
      masterCopy: getSafeSingletonDeployment({ version: '1.3.0' })?.defaultAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.UNKNOWN_SETUP_MODULES), false])
    })
  })

  it('should throw an error if RPC could not be created', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      setupToL2Address,
      faker.string.hexadecimal({ length: 64 }),
      faker.finance.ethereumAddress(),
      ZERO_ADDRESS,
      0,
      faker.finance.ethereumAddress(),
    ])

    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: faker.finance.ethereumAddress(),
      transactionHash: faker.string.hexadecimal({ length: 64 }),
      masterCopy: getSafeSingletonDeployment({ version: '1.3.0' })?.defaultAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue(undefined)

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.NO_PROVIDER), false])
    })
  })

  it('should throw an error if RPC cannot find the tx hash', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      setupToL2Address,
      faker.string.hexadecimal({ length: 64 }),
      faker.finance.ethereumAddress(),
      ZERO_ADDRESS,
      0,
      faker.finance.ethereumAddress(),
    ])

    const mockTxHash = faker.string.hexadecimal({ length: 64 })
    const mockFactoryAddress = faker.finance.ethereumAddress()
    const mockMasterCopyAddress = getSafeSingletonDeployment({ version: '1.3.0' })?.defaultAddress

    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: mockFactoryAddress,
      transactionHash: mockTxHash,
      masterCopy: mockMasterCopyAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue({
      getTransaction: () => Promise.resolve(null),
    } as unknown as JsonRpcProvider)

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.TX_NOT_FOUND), false])
    })
  })

  it('should throw an Error if an unsupported creation method is found', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      setupToL2Address,
      faker.string.hexadecimal({ length: 64 }),
      faker.finance.ethereumAddress(),
      ZERO_ADDRESS,
      0,
      faker.finance.ethereumAddress(),
    ])

    const mockTxHash = faker.string.hexadecimal({ length: 64 })
    const mockFactoryAddress = faker.finance.ethereumAddress()
    const mockMasterCopyAddress = getSafeSingletonDeployment({ version: '1.3.0' })?.defaultAddress!
    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: mockFactoryAddress,
      transactionHash: mockTxHash,
      masterCopy: mockMasterCopyAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue({
      getTransaction: (txHash: string) => {
        if (mockTxHash === txHash) {
          return Promise.resolve({
            to: mockFactoryAddress,
            data: Safe_proxy_factory__factory.createInterface().encodeFunctionData('createProxyWithCallback', [
              mockMasterCopyAddress,
              setupData,
              69,
              faker.finance.ethereumAddress(),
            ]),
          })
        }
      },
    } as JsonRpcProvider)

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_SAFE_CREATION), false])
    })
  })

  it('should throw an error if the setup data does not match', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      setupToL2Address,
      faker.string.hexadecimal({ length: 64 }),
      faker.finance.ethereumAddress(),
      ZERO_ADDRESS,
      0,
      faker.finance.ethereumAddress(),
    ])

    const nonMatchingSetupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      setupToL2Address,
      faker.string.hexadecimal({ length: 64 }),
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
      0,
      faker.finance.ethereumAddress(),
    ])

    const mockTxHash = faker.string.hexadecimal({ length: 64 })
    const mockFactoryAddress = faker.finance.ethereumAddress()
    const mockMasterCopyAddress = getSafeSingletonDeployment({ version: '1.3.0' })?.defaultAddress!
    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: mockFactoryAddress,
      transactionHash: mockTxHash,
      masterCopy: mockMasterCopyAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue({
      getTransaction: (txHash: string) => {
        if (mockTxHash === txHash) {
          return Promise.resolve({
            to: mockFactoryAddress,
            data: Safe_proxy_factory__factory.createInterface().encodeFunctionData('createProxyWithNonce', [
              mockMasterCopyAddress,
              nonMatchingSetupData,
              69,
            ]),
          })
        }
        return Promise.resolve(null)
      },
    } as JsonRpcProvider)

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_SAFE_CREATION), false])
    })
  })

  it('should throw an error if the masterCopies do not match', async () => {
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
      1,
      setupToL2Address,
      faker.string.hexadecimal({ length: 64, casing: 'lower' }),
      faker.finance.ethereumAddress(),
      ZERO_ADDRESS,
      0,
      faker.finance.ethereumAddress(),
    ])

    const mockTxHash = faker.string.hexadecimal({ length: 64 })
    const mockFactoryAddress = faker.finance.ethereumAddress()
    const mockMasterCopyAddress = getSafeSingletonDeployment({ version: '1.3.0' })?.defaultAddress!
    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: mockFactoryAddress,
      transactionHash: mockTxHash,
      masterCopy: mockMasterCopyAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue({
      getTransaction: (txHash: string) => {
        if (mockTxHash === txHash) {
          return Promise.resolve({
            to: mockFactoryAddress,
            data: Safe_proxy_factory__factory.createInterface().encodeFunctionData('createProxyWithNonce', [
              faker.finance.ethereumAddress(),
              setupData,
              69,
            ]),
          })
        }
        return Promise.resolve(null)
      },
    } as JsonRpcProvider)

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([undefined, new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_SAFE_CREATION), false])
    })
  })

  it('should return transaction data for direct Safe creation txs', async () => {
    const safeProps = {
      owners: [fakerChecksummedAddress(), fakerChecksummedAddress()],
      threshold: 1,
      to: setupToL2Address,
      data: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
      fallbackHandler: fakerChecksummedAddress(),
      paymentToken: ZERO_ADDRESS,
      payment: 0,
      paymentReceiver: fakerChecksummedAddress(),
    }
    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      safeProps.owners,
      safeProps.threshold,
      safeProps.to,
      safeProps.data,
      safeProps.fallbackHandler,
      safeProps.paymentToken,
      safeProps.payment,
      safeProps.paymentReceiver,
    ])

    const mockTxHash = faker.string.hexadecimal({ length: 64 })
    const mockFactoryAddress = fakerChecksummedAddress()
    const mockMasterCopyAddress = getSafeSingletonDeployment({ version: '1.3.0' })?.defaultAddress!
    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: fakerChecksummedAddress(),
      factoryAddress: mockFactoryAddress,
      transactionHash: mockTxHash,
      masterCopy: mockMasterCopyAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue({
      getTransaction: (txHash: string) => {
        if (mockTxHash === txHash) {
          return Promise.resolve({
            to: mockFactoryAddress,
            data: Safe_proxy_factory__factory.createInterface().encodeFunctionData('createProxyWithNonce', [
              mockMasterCopyAddress,
              setupData,
              69,
            ]),
          })
        }
        return Promise.resolve(null)
      },
    } as JsonRpcProvider)

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([
        {
          factoryAddress: mockFactoryAddress,
          masterCopy: mockMasterCopyAddress,
          safeAccountConfig: safeProps,
          saltNonce: '69',
          safeVersion: '1.3.0',
        },
        undefined,
        false,
      ])
    })
  })

  it('should return transaction data for creation bundles', async () => {
    const safeProps = {
      owners: [fakerChecksummedAddress(), fakerChecksummedAddress()],
      threshold: 1,
      to: setupToL2Address,
      data: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
      fallbackHandler: fakerChecksummedAddress(),
      paymentToken: ZERO_ADDRESS,
      payment: 0,
      paymentReceiver: fakerChecksummedAddress(),
    }

    const setupData = Safe__factory.createInterface().encodeFunctionData('setup', [
      safeProps.owners,
      safeProps.threshold,
      safeProps.to,
      safeProps.data,
      safeProps.fallbackHandler,
      safeProps.paymentToken,
      safeProps.payment,
      safeProps.paymentReceiver,
    ])

    const mockTxHash = faker.string.hexadecimal({ length: 64 })
    const mockFactoryAddress = faker.finance.ethereumAddress()
    const mockMasterCopyAddress = getSafeSingletonDeployment({ version: '1.4.1' })?.defaultAddress!

    jest.spyOn(cgwSdk, 'getCreationTransaction').mockResolvedValue({
      created: new Date(Date.now()).toISOString(),
      creator: faker.finance.ethereumAddress(),
      factoryAddress: mockFactoryAddress,
      transactionHash: mockTxHash,
      masterCopy: mockMasterCopyAddress,
      setupData,
      saltNonce: faker.string.hexadecimal({ length: 64 }),
    })

    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue({
      getTransaction: (txHash: string) => {
        if (txHash === mockTxHash) {
          const deploymentTx = {
            to: mockFactoryAddress,
            data: Safe_proxy_factory__factory.createInterface().encodeFunctionData('createProxyWithNonce', [
              mockMasterCopyAddress,
              setupData,
              69,
            ]),
            value: '0',
            operation: 0,
          }
          const someOtherTx = {
            to: faker.finance.ethereumAddress(),
            value: '0',
            operation: 0,
            data: faker.string.hexadecimal({ length: 64 }),
          }

          const multiSendData = encodeMultiSendData([deploymentTx, someOtherTx])
          return Promise.resolve({
            to: faker.finance.ethereumAddress(),
            data: Multi_send__factory.createInterface().encodeFunctionData('multiSend', [multiSendData]),
          })
        }
        return Promise.resolve(null)
      },
    } as JsonRpcProvider)

    const safeAddress = faker.finance.ethereumAddress()
    const chainInfos = [chainBuilder().with({ chainId: '1', l2: false }).build()]

    // Run hook
    const { result } = renderHook(() => useSafeCreationData(safeAddress, chainInfos))

    await waitFor(() => {
      expect(result.current).toEqual([
        {
          factoryAddress: mockFactoryAddress,
          masterCopy: mockMasterCopyAddress,
          safeAccountConfig: safeProps,
          safeVersion: '1.4.1',
          saltNonce: '69',
        },
        undefined,
        false,
      ])
    })
  })
})
