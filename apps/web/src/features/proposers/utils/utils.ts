import { signTypedData } from '@safe-global/utils/utils/web3'
import { SigningMethod } from '@safe-global/protocol-kit'
import { adjustVInSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import type { JsonRpcSigner } from 'ethers'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'

export const signProposerTypedData = async (chainId: string, proposerAddress: string, signer: JsonRpcSigner) => {
  const typedData = getDelegateTypedData(chainId, proposerAddress)
  return signTypedData(signer, typedData)
}

const getProposerDataV1 = (proposerAddress: string) => {
  const totp = Math.floor(Date.now() / 1000 / 3600)

  return `${proposerAddress}${totp}`
}

export const signProposerData = async (proposerAddress: string, signer: JsonRpcSigner) => {
  const data = getProposerDataV1(proposerAddress)

  const signature = await signer.signMessage(data)

  return adjustVInSignature(SigningMethod.ETH_SIGN_TYPED_DATA, signature)
}
