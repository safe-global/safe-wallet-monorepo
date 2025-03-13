// Be careful what you import here as it will increase the service worker bundle size

import { formatUnits } from 'ethers'
import { getBalances } from '@safe-global/safe-gateway-typescript-sdk'
import type { ChainInfo, TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'

import { WebhookType } from './webhook-types'
import type { WebhookEvent } from './webhook-types'

type PushNotificationsMap<T extends WebhookEvent = WebhookEvent> = {
  [P in T['type']]: (
    data: Extract<T, { type: P }>,
    chain?: ChainInfo,
  ) => Promise<{ title: string; body: string }> | { title: string; body: string } | null
}

const getChainName = (chainId: string, chain?: ChainInfo): string => {
  return chain?.chainName ?? `chain ${chainId}`
}

const getCurrencyName = (chain?: ChainInfo): string => {
  return chain?.nativeCurrency?.name ?? 'Ether'
}

const getCurrencySymbol = (chain?: ChainInfo): string => {
  return chain?.nativeCurrency?.symbol ?? 'ETH'
}

const getTokenInfo = async (
  chainId: string,
  safeAddress: string,
  tokenAddress: string,
  tokenValue?: string,
): Promise<{ symbol: string; value: string; name: string }> => {
  const DEFAULT_CURRENCY = 'USD'

  const DEFAULT_INFO = {
    symbol: 'tokens',
    value: 'some',
    name: 'Token',
  }

  let tokenInfo: TokenInfo | undefined

  try {
    const balances = await getBalances(chainId, safeAddress, DEFAULT_CURRENCY)
    tokenInfo = balances.items.find((token) => token.tokenInfo.address === tokenAddress)?.tokenInfo
  } catch {
    // Swallow error
  }

  if (!tokenInfo) {
    return DEFAULT_INFO
  }

  const symbol = tokenInfo?.symbol ?? DEFAULT_INFO.symbol
  const value =
    tokenValue && tokenInfo ? formatUnits(tokenValue, tokenInfo.decimals ?? 0).toString() : DEFAULT_INFO.value
  const name = tokenInfo?.name ?? DEFAULT_INFO.name

  return {
    symbol,
    value,
    name,
  }
}

const shortenAddress = (address: string, length = 4): string => {
  if (!address) {
    return ''
  }

  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}

export const Notifications: PushNotificationsMap = {
  [WebhookType.EXECUTED_MULTISIG_TRANSACTION]: ({ address, failed, txHash, chainId }, chain) => {
    const didFail = failed === 'true'
    return {
      title: `Transaction ${didFail ? 'failed' : 'executed'}`,
      body: `Safe ${shortenAddress(address)} on ${getChainName(chainId, chain)} ${
        didFail ? 'failed to execute' : 'executed'
      } transaction ${shortenAddress(txHash)}.`,
    }
  },
  [WebhookType.INCOMING_ETHER]: ({ address, txHash, value, chainId }, chain) => {
    return {
      title: `${getCurrencyName(chain)} received`,
      body: `Safe ${shortenAddress(address)} on ${getChainName(chainId, chain)} received ${formatUnits(
        value,
        chain?.nativeCurrency?.decimals,
      ).toString()} ${getCurrencySymbol(chain)} in transaction ${shortenAddress(txHash)}.`,
    }
  },
  [WebhookType.INCOMING_TOKEN]: async ({ address, txHash, tokenAddress, value, chainId }, chain) => {
    const token = await getTokenInfo(chainId, address, tokenAddress, value)
    return {
      title: `${token.name} received`,
      body: `Safe ${shortenAddress(address)} on ${getChainName(chainId, chain)} received ${token.value} ${
        token.symbol
      } in transaction ${shortenAddress(txHash)}.`,
    }
  },
  [WebhookType.MODULE_TRANSACTION]: ({ address, module, txHash, chainId }, chain) => {
    return {
      title: 'Module transaction',
      body: `Safe ${shortenAddress(address)} on ${getChainName(
        chainId,
        chain,
      )} executed a module transaction ${shortenAddress(txHash)} from module ${shortenAddress(module)}.`,
    }
  },
  [WebhookType.CONFIRMATION_REQUEST]: ({ address, safeTxHash, chainId }, chain) => {
    return {
      title: 'Confirmation request',
      body: `Safe ${shortenAddress(address)} on ${getChainName(
        chainId,
        chain,
      )} has a new confirmation request for transaction ${shortenAddress(safeTxHash)}.`,
    }
  },
  [WebhookType.SAFE_CREATED]: () => {
    // We do not preemptively subscribe to Safes before they are created
    return null
  },
  // Disabled on the Transaction Service
  [WebhookType._PENDING_MULTISIG_TRANSACTION]: () => {
    // We don't send notifications for pending transactions
    // @see https://github.com/safe-global/safe-transaction-service/blob/master/safe_transaction_service/notifications/tasks.py#L34
    return null
  },
  [WebhookType._NEW_CONFIRMATION]: () => {
    // Disabled for now
    // @see https://github.com/safe-global/safe-transaction-service/blob/master/safe_transaction_service/notifications/tasks.py#L43
    return null
  },
  [WebhookType._OUTGOING_TOKEN]: () => {
    // We don't sen as we have execution notifications
    // @see https://github.com/safe-global/safe-transaction-service/blob/master/safe_transaction_service/notifications/tasks.py#L48
    return null
  },
  [WebhookType._OUTGOING_ETHER]: () => {
    // We don't sen as we have execution notifications
    // @see https://github.com/safe-global/safe-transaction-service/blob/master/safe_transaction_service/notifications/tasks.py#L48
    return null
  },
}
