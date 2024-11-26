import { BACKEND_BASE_URI } from '@/config/constants'
import { CHAIN_ID, JSON_RPC_PROVIDER } from '@/features/superChain/constants'
import { createSmartAccountClient } from 'permissionless'
import { toSafeSmartAccount } from 'permissionless/accounts'
import { createPimlicoClient } from 'permissionless/clients/pimlico'
import { type Address, createPublicClient, http, WalletClient, Transport, Account, Chain } from 'viem'
import { entryPoint07Address } from 'viem/account-abstraction'
import { sepolia, optimism } from 'viem/chains'

const pimlicoTransport = () => {
  return http(`${BACKEND_BASE_URI}/user-op-reverse-proxy`, {
    fetchOptions: {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    },
  })
}

export const publicClient = createPublicClient({
  transport: http(JSON_RPC_PROVIDER),
  chain: optimism,
})

export const paymasterClient = () =>
  createPimlicoClient({
    transport: pimlicoTransport(),
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
  })

export const pimlicoBundlerClient = () =>
  createPimlicoClient({
    transport: pimlicoTransport(),
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
  })

export async function getSmartAccountClient(
  client: WalletClient<Transport, Chain | undefined, Account>,
  safeAddress: Address,
) {
  const safeAccount = await toSafeSmartAccount({
    client: publicClient,
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
    version: '1.4.1',
    address: safeAddress,
    owners: [client],
  })
  const smartAccountClient = createSmartAccountClient({
    account: safeAccount,
    chain: CHAIN_ID === sepolia.id.toString() ? sepolia : optimism,
    bundlerTransport: pimlicoTransport(),
    paymaster: paymasterClient(),
    userOperation: {
      estimateFeesPerGas: async () => (await paymasterClient().getUserOperationGasPrice()).fast,
    },
    // middleware: {
    //   sponsorUserOperation: async (args: any) => {
    //     return paymasterClient().sponsorUserOperation({
    //       ...args,
    //       sponsorshipPolicyId: 'sp_burly_overlord',
    //     })
    //   },
    //   gasPrice: async () => (await pimlicoBundlerClient().getUserOperationGasPrice()).fast, // if using pimlico bundler
    // },
  })
  return smartAccountClient
}
