import Safe, {
  PasskeyArgType,
  ExtractedPasskeyData,
  getPasskeyOwnerAddress,
  getP256VerifierAddress,
  getSafeWebAuthnSignerFactoryContract,
} from '@safe-global/protocol-kit'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createWeb3ReadOnly, getRpcServiceUrl } from '@/src/services/web3'
import { SafeInfo } from '@/src/types/address'
import logger from '@/src/utils/logger'

const DEPLOYMENT_POLL_INTERVAL_MS = 3_000
const DEPLOYMENT_TIMEOUT_MS = 120_000

export async function createPasskeySigner(passkeyCredential: Credential): Promise<ExtractedPasskeyData> {
  return Safe.createPasskeySigner(passkeyCredential)
}

function buildPasskeyArg(
  passkey: { rawId: string; coordinates: { x: string; y: string } },
  chainId: string,
  getFn?: (options?: CredentialRequestOptions) => Promise<Credential>,
): PasskeyArgType {
  return {
    rawId: passkey.rawId,
    coordinates: passkey.coordinates,
    verifierAddress: getP256VerifierAddress(chainId),
    ...(getFn && { getFn }),
  }
}

async function initProtocolKitWithPasskey(signer: PasskeyArgType, safeAddress: string, chain: Chain): Promise<Safe> {
  const rpcUrl = getRpcServiceUrl(chain.rpcUri)
  return Safe.init({
    provider: rpcUrl,
    signer,
    safeAddress,
  })
}

export async function getIdentityAddress(
  passkey: ExtractedPasskeyData,
  safeAddress: string,
  chain: Chain,
): Promise<string> {
  const signer = buildPasskeyArg(passkey, chain.chainId)
  const protocolKit = await initProtocolKitWithPasskey(signer, safeAddress, chain)
  return getPasskeyOwnerAddress(protocolKit, signer)
}

export async function isIdentityDeployed(address: string, chain: Chain): Promise<boolean> {
  const provider = createWeb3ReadOnly(chain)
  if (!provider) {
    throw new Error('Failed to create provider')
  }

  const code = await provider.getCode(address)
  return code !== '0x'
}

interface DeployIdentityParams {
  signer: { rawId: string; coordinates: { x: string; y: string } }
  activeSafe: SafeInfo
  chain: Chain
  relayMutation: (args: {
    chainId: string
    relayDto: { to: string; data: string; version: string }
  }) => Promise<{ taskId: string }>
}

export async function deployIdentityContract({
  signer,
  activeSafe,
  chain,
  relayMutation,
}: DeployIdentityParams): Promise<{ taskId: string }> {
  const passkeyArg = buildPasskeyArg(signer, chain.chainId)
  const protocolKit = await initProtocolKitWithPasskey(passkeyArg, activeSafe.address, chain)

  const safeProvider = protocolKit.getSafeProvider()
  const safeVersion = protocolKit.getContractVersion()
  const factoryContract = await getSafeWebAuthnSignerFactoryContract({
    safeProvider,
    safeVersion,
  })

  const data = factoryContract.encode('createSigner', [
    BigInt(passkeyArg.coordinates.x),
    BigInt(passkeyArg.coordinates.y),
    BigInt(passkeyArg.verifierAddress),
  ])

  return await relayMutation({
    chainId: chain.chainId,
    relayDto: {
      to: factoryContract.getAddress(),
      data,
      version: '1.3.0',
    },
  })
}

interface PollDeploymentParams {
  taskId: string
  chainId: string
  pollTaskStatus: (args: {
    chainId: string
    taskId: string
  }) => Promise<{ status: number; receipt?: { transactionHash: string } }>
  onStatusUpdate?: (status: number) => void
}

export async function waitForDeployment({
  taskId,
  chainId,
  pollTaskStatus,
  onStatusUpdate,
}: PollDeploymentParams): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < DEPLOYMENT_TIMEOUT_MS) {
    const result = await pollTaskStatus({ chainId, taskId })

    onStatusUpdate?.(result.status)

    if (result.status === 200) {
      logger.info('Identity contract deployed:', result.receipt?.transactionHash)
      return
    }

    if (result.status === 400 || result.status === 500) {
      throw new Error(
        result.status === 400
          ? 'Identity contract deployment was rejected'
          : 'Identity contract deployment was reverted',
      )
    }

    // 100 = Pending, 110 = Submitted — keep polling
    await new Promise((resolve) => setTimeout(resolve, DEPLOYMENT_POLL_INTERVAL_MS))
  }

  throw new Error('Identity contract deployment timed out after 2 minutes')
}
