import { formatUnits } from 'ethers'
import { NotificationType } from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
import { selectChainById } from '@/src/store/chains'
import { shortenAddress } from '@/src/utils/formatters'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { getStore } from '@/src/store/utils/singletonStore'

export interface ParsedNotification {
  title: string
  body: string
}

export const parseNotification = (data?: Record<string, unknown>): ParsedNotification | null => {
  if (!data || !data.type) {
    return null
  }

  const strData = data as Record<string, string>

  const type = strData.type as NotificationType
  const chainId = strData.chainId
  const address = strData.address

  const state = getStore().getState()
  const chain = chainId ? selectChainById(state, chainId) : null

  const chainName = chain?.chainName ?? `Chain Id ${chainId}`

  const safeName =
    selectContactByAddress(address as `0x${string}`)(state)?.name ?? (address ? shortenAddress(address) : '')

  switch (type) {
    case 'INCOMING_ETHER': {
      const symbol = chain?.nativeCurrency?.symbol ?? 'ETH'
      const decimals = chain?.nativeCurrency?.decimals ?? 18
      const value = strData.value ? formatUnits(strData.value, decimals) : ''
      return {
        title: `Incoming ${symbol} (${chainName})`,
        body: `${safeName}: ${value} ${symbol} received`,
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
