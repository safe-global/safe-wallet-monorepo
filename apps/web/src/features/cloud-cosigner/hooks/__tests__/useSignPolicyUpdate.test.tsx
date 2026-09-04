import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { renderHook } from '@/tests/test-utils'
import useWallet from '@/hooks/wallets/useWallet'
import { createWeb3 } from '@/hooks/wallets/web3'
import { isPKWallet } from '@/utils/wallets'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { buildPolicyMessage } from '../../services/policyMessage'
import { useSignPolicyUpdate } from '../useSignPolicyUpdate'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/wallets/web3')
jest.mock('@/utils/wallets')

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockCreateWeb3 = createWeb3 as jest.MockedFunction<typeof createWeb3>
const mockIsPKWallet = isPKWallet as jest.MockedFunction<typeof isPKWallet>

describe('useSignPolicyUpdate', () => {
  const chainId = '1'
  const safeAddress = checksumAddress(faker.finance.ethereumAddress())
  const signerAddress = checksumAddress(faker.finance.ethereumAddress())
  const policy = { valueThresholdUsd: 100000, reviewUnknownContracts: true, instructions: null }
  const signMessage = jest.fn()
  const send = jest.fn()

  beforeEach(() => {
    signMessage.mockReset()
    send.mockReset()
    mockUseWallet.mockReturnValue(connectedWalletBuilder().build())
    mockCreateWeb3.mockReturnValue({
      getSigner: () => Promise.resolve({ address: signerAddress, signMessage }),
      send,
    } as unknown as ReturnType<typeof createWeb3>)
    mockIsPKWallet.mockReturnValue(false)
  })

  it('signs the policy message with the wallet signer', async () => {
    signMessage.mockResolvedValue('0xsig')
    const { result } = renderHook(() => useSignPolicyUpdate())

    const signed = await result.current({ chainId, safeAddress, policy })

    expect(signed).toEqual({ signature: '0xsig', signer: signerAddress, issuedAt: expect.any(String) })
    expect(signMessage).toHaveBeenCalledWith(
      buildPolicyMessage({ chainId, safeAddress, issuedAt: signed.issuedAt, policy }),
    )
    expect(send).not.toHaveBeenCalled()
  })

  it('uses personal_sign for the private-key wallet', async () => {
    mockIsPKWallet.mockReturnValue(true)
    send.mockResolvedValue('0xpk')
    const { result } = renderHook(() => useSignPolicyUpdate())

    const signed = await result.current({ chainId, safeAddress, policy })

    expect(signed.signature).toBe('0xpk')
    expect(send).toHaveBeenCalledWith('personal_sign', [
      expect.stringContaining('Safe cloud cosigner policy update'),
      signerAddress.toLowerCase(),
    ])
    expect(signMessage).not.toHaveBeenCalled()
  })

  it('throws without a connected wallet', async () => {
    mockUseWallet.mockReturnValue(null)
    const { result } = renderHook(() => useSignPolicyUpdate())

    await expect(result.current({ chainId, safeAddress, policy })).rejects.toThrow('No wallet connected')
  })
})
