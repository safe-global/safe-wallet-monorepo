import { isIdentityDeployed, waitForDeployment } from './identity-contract.service'
import { createWeb3ReadOnly } from '@/src/services/web3'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

jest.mock('@safe-global/protocol-kit', () => ({
  __esModule: true,
  default: { createPasskeySigner: jest.fn(), init: jest.fn() },
  getPasskeyOwnerAddress: jest.fn(),
  getP256VerifierAddress: jest.fn(() => '0xverifier'),
  getSafeWebAuthnSignerFactoryContract: jest.fn(),
}))

jest.mock('@/src/services/web3', () => ({
  createWeb3ReadOnly: jest.fn(),
  getRpcServiceUrl: jest.fn(() => 'https://rpc.example.com'),
}))

const mockChain = {
  chainId: '1',
  rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.example.com' },
  safeWebAuthnSignerFactoryAddress: '0x1d31F259eE307358a26dFb23EB365939E8641195',
} as unknown as Chain

describe('identity-contract.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isIdentityDeployed', () => {
    it('should return true when contract has code', async () => {
      const mockProvider = { getCode: jest.fn().mockResolvedValue('0x1234') }
      ;(createWeb3ReadOnly as jest.Mock).mockReturnValue(mockProvider)

      const result = await isIdentityDeployed('0xabcdef', mockChain)

      expect(result).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledWith('0xabcdef')
    })

    it('should return false when contract has no code', async () => {
      const mockProvider = { getCode: jest.fn().mockResolvedValue('0x') }
      ;(createWeb3ReadOnly as jest.Mock).mockReturnValue(mockProvider)

      const result = await isIdentityDeployed('0xabcdef', mockChain)

      expect(result).toBe(false)
    })

    it('should throw when provider creation fails', async () => {
      ;(createWeb3ReadOnly as jest.Mock).mockReturnValue(undefined)

      await expect(isIdentityDeployed('0xabcdef', mockChain)).rejects.toThrow('Failed to create provider')
    })
  })

  describe('waitForDeployment', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should resolve when task status is 200', async () => {
      const pollTaskStatus = jest.fn().mockResolvedValue({ status: 200, receipt: { transactionHash: '0x123' } })

      const promise = waitForDeployment({
        taskId: 'task-1',
        chainId: '1',
        pollTaskStatus,
      })

      await promise

      expect(pollTaskStatus).toHaveBeenCalledWith({ chainId: '1', taskId: 'task-1' })
    })

    it('should throw when task status is 400 (rejected)', async () => {
      const pollTaskStatus = jest.fn().mockResolvedValue({ status: 400 })

      await expect(
        waitForDeployment({
          taskId: 'task-1',
          chainId: '1',
          pollTaskStatus,
        }),
      ).rejects.toThrow('rejected')
    })

    it('should throw when task status is 500 (reverted)', async () => {
      const pollTaskStatus = jest.fn().mockResolvedValue({ status: 500 })

      await expect(
        waitForDeployment({
          taskId: 'task-1',
          chainId: '1',
          pollTaskStatus,
        }),
      ).rejects.toThrow('reverted')
    })

    it('should call onStatusUpdate callback', async () => {
      const onStatusUpdate = jest.fn()
      const pollTaskStatus = jest.fn().mockResolvedValue({ status: 200, receipt: { transactionHash: '0x123' } })

      await waitForDeployment({
        taskId: 'task-1',
        chainId: '1',
        pollTaskStatus,
        onStatusUpdate,
      })

      expect(onStatusUpdate).toHaveBeenCalledWith(200)
    })
  })
})
