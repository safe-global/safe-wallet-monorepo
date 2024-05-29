import { createSmartAccountClient, ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import type { SmartAccountSigner } from 'permissionless/_types/accounts'
import { signerToSafeSmartAccount } from 'permissionless/accounts'
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from 'permissionless/clients/pimlico'
import { type Address, createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

export const publicClient = createPublicClient({
  transport: http('https://rpc.ankr.com/eth_sepolia'),
})

export const paymasterClient = createPimlicoPaymasterClient({
  transport: http('https://api.pimlico.io/v2/11155111/rpc?apikey=e6fcaa0f-01c7-4f6c-93a6-260e48848daf'),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
})

export const pimlicoBundlerClient = createPimlicoBundlerClient({
  transport: http('https://api.pimlico.io/v2/11155111/rpc?apikey=e6fcaa0f-01c7-4f6c-93a6-260e48848daf'),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
})

export async function getSmartAccountClient(signer: SmartAccountSigner, safeAddress: Address) {
  const safeAccount = await signerToSafeSmartAccount(publicClient, {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    signer,
    safeVersion: '1.4.1',
    address: safeAddress,
  })

  const smartAccountClient = createSmartAccountClient({
    account: safeAccount,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: sepolia,
    bundlerTransport: http('https://api.pimlico.io/v2/11155111/rpc?apikey=e6fcaa0f-01c7-4f6c-93a6-260e48848daf'),
    middleware: {
      sponsorUserOperation: paymasterClient.sponsorUserOperation, // optional
      gasPrice: async () => (await pimlicoBundlerClient.getUserOperationGasPrice()).fast, // if using pimlico bundler
    },
  })
  return smartAccountClient
}
