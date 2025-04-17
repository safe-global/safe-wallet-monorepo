import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

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
