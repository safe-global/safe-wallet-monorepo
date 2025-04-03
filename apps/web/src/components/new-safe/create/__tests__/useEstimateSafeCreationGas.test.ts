import * as sender from '@/components/new-safe/create/logic'
import { useEstimateSafeCreationGas } from '@/components/new-safe/create/useEstimateSafeCreationGas'
import * as chainIdModule from '@/hooks/useChainId'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as wallet from '@/hooks/wallets/useWallet'
import * as web3 from '@/hooks/wallets/web3'
import * as safeContracts from '@/services/contracts/safeContracts'
import * as store from '@/store'
import { renderHook } from '@/tests/test-utils'
import type { SafeProxyFactoryContractImplementationType } from '@safe-global/protocol-kit/dist/src/types/contracts'
import { JsonRpcProvider } from 'ethers'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { waitFor } from '@testing-library/react'
import { type EIP1193Provider } from '@web3-onboard/core'
import { type ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { faker } from '@faker-js/faker'

const mockProps: ReplayedSafeProps = {
  safeAccountConfig: {
    owners: [faker.finance.ethereumAddress()],
    threshold: 1,
    data: EMPTY_DATA,
    to: ZERO_ADDRESS,
    fallbackHandler: faker.finance.ethereumAddress(),
    paymentReceiver: ZERO_ADDRESS,
  },
  factoryAddress: faker.finance.ethereumAddress(),
  masterCopy: faker.finance.ethereumAddress(),
  saltNonce: '0',
  safeVersion: '1.3.0',
}

describe('useEstimateSafeCreationGas', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(store, 'useAppSelector').mockReturnValue({})
    jest.spyOn(chainIdModule, 'useChainId').mockReturnValue('4')
    jest
      .spyOn(safeContracts, 'getReadOnlyProxyFactoryContract')
      .mockResolvedValue({ getAddress: () => ZERO_ADDRESS } as unknown as SafeProxyFactoryContractImplementationType)
    jest.spyOn(sender, 'encodeSafeCreationTx').mockReturnValue(EMPTY_DATA)
    jest.spyOn(wallet, 'default').mockReturnValue({} as ConnectedWallet)
  })

  it('should return no gasLimit by default', () => {
    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))
    expect(result.current.gasLimit).toBeUndefined()
    expect(result.current.gasLimitLoading).toBe(false)
  })

  it('should estimate gas', async () => {
    const mockProvider = new JsonRpcProvider()
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider)
    jest.spyOn(sender, 'estimateSafeCreationGas').mockReturnValue(Promise.resolve(BigInt('123')))
    jest.spyOn(wallet, 'default').mockReturnValue({
      label: 'MetaMask',
      chainId: '4',
      address: ZERO_ADDRESS,
      provider: null as unknown as EIP1193Provider,
    })

    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))

    await waitFor(() => {
      expect(result.current.gasLimit).toStrictEqual(BigInt('123'))
      expect(result.current.gasLimitLoading).toBe(false)
    })
  })

  it('should not estimate gas if there is no wallet connected', async () => {
    jest.spyOn(wallet, 'default').mockReturnValue(null)
    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))

    await waitFor(() => {
      expect(result.current.gasLimit).toBeUndefined()
      expect(result.current.gasLimitLoading).toBe(false)
    })
  })

  it('should not estimate gas if there is no provider', async () => {
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(undefined)
    const { result } = renderHook(() => useEstimateSafeCreationGas(mockProps))

    await waitFor(() => {
      expect(result.current.gasLimit).toBeUndefined()
      expect(result.current.gasLimitLoading).toBe(false)
    })
  })
})
