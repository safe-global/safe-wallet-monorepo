import { readFile } from 'node:fs/promises'
import { getAddress, isAddress } from 'ethers'
import { runInLocalService } from './local-service.mjs'
import { waitUntil } from './indexing.mjs'
import { SEPOLIA } from './chain.mjs'

const isValid = ({ address, chainId, name, abi }) =>
  isAddress(address) && Number(chainId) === SEPOLIA && name && Array.isArray(abi) && abi.length > 0

/** Registers the contracts in one decoder process, because each process start takes about 1.5 s. */
export async function registerContracts(env, contracts) {
  if (!contracts.every(isValid)) throw new Error('Contract metadata requires a Sepolia address, name and ABI')
  const script = await readFile(new URL('./register-contract.py', import.meta.url), 'utf8')
  await runInLocalService(
    env,
    'decoder-web',
    ['python', '-c', script],
    JSON.stringify(
      contracts.map(({ address, chainId, name, abi }) => ({ address, chainId: Number(chainId), name, abi })),
    ),
  )
  // No event announces this write, so drop the answers that the decoder (db 2, 60 s) and CGW cached before it.
  const decoderKeys = contracts.map(({ address }) => `contract:${address.toLowerCase()}`)
  const gatewayKeys = contracts.map(({ address, chainId }) => `${chainId}_contracts_${getAddress(address)}`)
  await runInLocalService(env, 'redis', ['redis-cli', '-n', '2', 'DEL', ...decoderKeys])
  await runInLocalService(env, 'redis', ['redis-cli', 'DEL', ...gatewayKeys])
  await Promise.all(
    contracts.map(({ address, chainId, name, abi }) =>
      waitUntil(
        env,
        `${env.SAFE_CGW_BASE_URL}/v1/chains/${chainId}/contracts/${address}`,
        (contract) => contract.displayName === name && contract.contractAbi?.abi?.length === abi.length,
      ),
    ),
  )
}

export const registerContract = (env, contract) => registerContracts(env, [contract])
