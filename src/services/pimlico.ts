import { BACKEND_BASE_URI } from '@/config/constants'
import { CHAIN_ID, JSON_RPC_PROVIDER } from '@/features/superChain/constants'
import { createSmartAccountClient, ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import type { SmartAccountSigner } from 'permissionless/_types/accounts'
import { signerToSafeSmartAccount } from 'permissionless/accounts'
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from 'permissionless/clients/pimlico'
import { type Address, createPublicClient, http } from 'viem'
import { sepolia, optimism } from 'viem/chains'

const pimlicoTransport = (jwt: string) => {
  return http(`${BACKEND_BASE_URI}/user-op-reverse-proxy`, {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  })
}

export const publicClient = createPublicClient({
  transport: http(JSON_RPC_PROVIDER),
})

export const paymasterClient = (jwt: string) =>
  createPimlicoPaymasterClient({
    transport: pimlicoTransport(jwt),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  })

export const pimlicoBundlerClient = (jwt: string) =>
  createPimlicoBundlerClient({
    transport: pimlicoTransport(jwt),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  })

export async function getSmartAccountClient(signer: SmartAccountSigner, safeAddress: Address, jwt: string) {
  const safeAccount = await signerToSafeSmartAccount(publicClient, {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    signer,
    safeVersion: '1.4.1',
    address: safeAddress,
  })
  const smartAccountClient = createSmartAccountClient({
    account: safeAccount,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism,
    bundlerTransport: pimlicoTransport(jwt),
    middleware: {
      sponsorUserOperation: async (args: any) => {
        return paymasterClient(jwt).sponsorUserOperation({
          ...args,
          sponsorshipPolicyId: 'sp_lively_mesmero',
        })
      },
      gasPrice: async () => (await pimlicoBundlerClient(jwt).getUserOperationGasPrice()).fast, // if using pimlico bundler
    },
  })
  return smartAccountClient
}
