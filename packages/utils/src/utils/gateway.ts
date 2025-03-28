import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { JsonRpcSigner } from 'ethers'
import { signTypedData } from '@safe-global/web/src/utils/web3'

export const _replaceTemplate = (uri: string, data: Record<string, string>): string => {
  // Template syntax returned from gateway is {{this}}
  const TEMPLATE_REGEX = /\{\{([^}]+)\}\}/g

  return uri.replace(TEMPLATE_REGEX, (_, key: string) => data[key])
}

export const getHashedExplorerUrl = (
  hash: string,
  blockExplorerUriTemplate: Chain['blockExplorerUriTemplate'],
): string => {
  const isTx = hash.length > 42
  const param = isTx ? 'txHash' : 'address'

  return _replaceTemplate(blockExplorerUriTemplate[param], { [param]: hash })
}
export const getExplorerLink = (
  hash: string,
  blockExplorerUriTemplate: Chain['blockExplorerUriTemplate'],
): { href: string; title: string } => {
  const href = getHashedExplorerUrl(hash, blockExplorerUriTemplate)
  const title = `View on ${new URL(href).hostname}`

  return { href, title }
}
export const signTxServiceMessage = async (
  chainId: string,
  safeAddress: string,
  safeTxHash: string,
  signer: JsonRpcSigner,
): Promise<string> => {
  return await signTypedData(signer, {
    types: {
      DeleteRequest: [
        { name: 'safeTxHash', type: 'bytes32' },
        { name: 'totp', type: 'uint256' },
      ],
    },
    domain: {
      name: 'Safe Transaction Service',
      version: '1.0',
      chainId,
      verifyingContract: safeAddress,
    },
    message: {
      safeTxHash,
      totp: Math.floor(Date.now() / 3600e3),
    },
  })
}