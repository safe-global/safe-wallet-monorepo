import { getModuleInstance, KnownContracts } from '@gnosis.pm/zodiac'
import type { Eip1193Provider } from 'ethers'
import { getUncheckedSigner } from '@/services/tx/tx-sender/sdk'
import { isSmartContractWallet } from '@/utils/wallets'

export async function getDelayModifierContract({
  provider,
  chainId,
  delayModifierAddress,
  signerAddress,
}: {
  provider: Eip1193Provider
  chainId: string
  delayModifierAddress: string
  signerAddress: string
}) {
  const isSmartContract = await isSmartContractWallet(chainId, signerAddress)

  const signer = await getUncheckedSigner(provider)
  const delayModifier = getModuleInstance(KnownContracts.DELAY, delayModifierAddress, signer).connect(signer)

  return {
    isUnchecked: isSmartContract,
    delayModifier,
  }
}
