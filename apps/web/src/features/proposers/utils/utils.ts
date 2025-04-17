import { signTypedData } from '@safe-global/utils/utils/web3'
import { SigningMethod } from '@safe-global/protocol-kit'
import { adjustVInSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import type { JsonRpcSigner } from 'ethers'

const getProposerDataV2 = (chainId: string, proposerAddress: string) => {
  const totp = Math.floor(Date.now() / 1000 / 3600)

  const domain = {
    name: 'Safe Transaction Service',
    version: '1.0',
    chainId: Number(chainId),
  }

  const types = {
    Delegate: [
      { name: 'delegateAddress', type: 'address' },
      { name: 'totp', type: 'uint256' },
    ],
  }

  const message = {
    delegateAddress: proposerAddress,
    totp,
  }

  return {
    domain,
    types,
    message,
    primaryType: 'Delegate',
  }
}

export const signProposerTypedData = async (chainId: string, proposerAddress: string, signer: JsonRpcSigner) => {
  const typedData = getProposerDataV2(chainId, proposerAddress)
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
