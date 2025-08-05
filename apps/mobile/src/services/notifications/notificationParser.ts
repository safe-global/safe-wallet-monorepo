import { formatUnits } from 'ethers'
import { NotificationType } from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
import { selectChainById } from '@/src/store/chains'
import { shortenAddress } from '@/src/utils/formatters'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { getStore } from '@/src/store/utils/singletonStore'
import { getExtensionData } from './store-sync/read'
import Logger from '@/src/utils/logger'

export interface ParsedNotification {
  title: string
  body: string
}

interface NotificationMetadata {
  chainName: string
  chainSymbol: string
  chainDecimals: number
  safeName: string
}

const getNotificationMetadata = (chainId?: string, address?: string): NotificationMetadata => {
  let chainData: { name?: string; symbol?: string; decimals?: number } | null = null
  let contactName: string | undefined = undefined

  try {
    // Try to use Redux store first (foreground mode)
    const state = getStore().getState()
    const chain = chainId ? selectChainById(state, chainId) : null
    chainData = chain
      ? {
          name: chain.chainName,
          symbol: chain.nativeCurrency?.symbol,
          decimals: chain.nativeCurrency?.decimals,
        }
      : null
    contactName = selectContactByAddress(address as `0x${string}`)(state)?.name
  } catch (_error) {
    // Fallback to extension MMKV storage (background|quit mode)
    Logger.info('parseNotification: Redux store not available, using extension storage fallback')
    const extensionData = getExtensionData()
    const extChainData = chainId ? extensionData?.chains[chainId] : undefined
    chainData = extChainData
      ? {
          name: extChainData.name,
          symbol: extChainData.symbol,
          decimals: extChainData.decimals,
        }
      : null
    contactName = address && extensionData?.contacts[address]
  }

  // Set variables based on fetched data
  return {
    chainName: chainData?.name ?? `Chain Id ${chainId}`,
    chainSymbol: chainData?.symbol ?? 'ETH',
    chainDecimals: chainData?.decimals ?? 18,
    safeName: contactName ?? (address ? shortenAddress(address) : ''),
  }
}

export const parseNotification = (data?: Record<string, unknown>): ParsedNotification | null => {
  if (!data || !data.type) {
    return null
  }

  const strData = data as Record<string, string>

  const type = strData.type as NotificationType
  const chainId = strData.chainId
  const address = strData.address

  const { chainName, chainSymbol, chainDecimals, safeName } = getNotificationMetadata(chainId, address)

  switch (type) {
    case 'INCOMING_ETHER': {
      const value = strData.value ? formatUnits(strData.value, chainDecimals) : ''
      return {
        title: `Incoming ${chainSymbol} (${chainName})`,
        body: `${safeName}: ${value} ${chainSymbol} received`,
      }
    }
    case 'INCOMING_TOKEN': {
      return {
        title: `Incoming token (${chainName})`,
        body: `${safeName}: tokens received`,
      }
    }
    case 'EXECUTED_MULTISIG_TRANSACTION': {
      const status = strData.failed === 'true' ? 'failed' : 'successful'
      return {
        title: `Transaction ${status} (${chainName})`,
        body: `${safeName}: Transaction ${status}`,
      }
    }
    case 'CONFIRMATION_REQUEST': {
      return {
        title: `Confirmation required (${chainName})`,
        body: `${safeName}: A transaction requires your confirmation!`,
      }
    }
    default:
      return null
  }
}
