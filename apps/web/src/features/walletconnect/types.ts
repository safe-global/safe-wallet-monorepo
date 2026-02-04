import type { Dispatch, SetStateAction } from 'react'
import type { SessionTypes } from '@walletconnect/types'
import type { WalletKitTypes } from '@reown/walletkit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { AppInfo } from '@/services/safe-wallet-provider'
import type { SafeItem } from '@/hooks/safes'
import type WalletConnectWallet from './services/WalletConnectWallet'

export enum WCLoadingState {
  APPROVE = 'Approve',
  REJECT = 'Reject',
  CONNECT = 'Connect',
  DISCONNECT = 'Disconnect',
}

export type WalletConnectContextType = {
  walletConnect: WalletConnectWallet | null
  sessions: SessionTypes.Struct[]
  sessionProposal: WalletKitTypes.SessionProposal | null
  error: Error | null
  setError: Dispatch<SetStateAction<Error | null>>
  open: boolean
  setOpen: (open: boolean) => void
  loading: WCLoadingState | null
  setLoading: Dispatch<SetStateAction<WCLoadingState | null>>
  approveSession: () => Promise<void>
  rejectSession: () => Promise<void>
}

export type WcChainSwitchRequest = {
  appInfo: AppInfo
  chain: Chain
  safes: SafeItem[]
  onSelectSafe: (safe: SafeItem) => Promise<void>
  onCancel: () => void
}

export type WcAutoApproveProps = Record<string, Record<string, boolean>>
