import { useCallback, useEffect, useRef } from 'react'
import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { useStableAppKitEvent } from './useStableAppKitEvent'

export interface ConnectResult {
  address: string
  walletName: string
  walletIcon: string
}

export class ConnectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConnectError'
  }
}

export class UserRejectedError extends Error {
  constructor() {
    super('User rejected the connection request')
    this.name = 'UserRejectedError'
  }
}

interface PendingConnect {
  resolve: (result: ConnectResult) => void
  reject: (error: Error) => void
}

/**
 * Returns a `connect()` function that opens the AppKit modal and
 * returns a promise resolving with the connected wallet's address
 * and name. Rejects on CONNECT_ERROR or USER_REJECTED.
 */
export function useConnect() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { walletInfo } = useWalletInfo()
  const pendingRef = useRef<PendingConnect | null>(null)

  useEffect(() => {
    if (!pendingRef.current || !isConnected || !address || !walletInfo?.name || !walletInfo?.icon) {
      return
    }

    const { resolve } = pendingRef.current
    pendingRef.current = null
    resolve({ address, walletName: walletInfo.name, walletIcon: walletInfo.icon })
  }, [isConnected, address, walletInfo])

  useStableAppKitEvent('CONNECT_ERROR', () => {
    if (!pendingRef.current) {
      return
    }
    const { reject } = pendingRef.current
    pendingRef.current = null
    reject(new ConnectError('Connection failed'))
  })

  useStableAppKitEvent('USER_REJECTED', () => {
    if (!pendingRef.current) {
      return
    }
    const { reject } = pendingRef.current
    pendingRef.current = null
    reject(new UserRejectedError())
  })

  const connect = useCallback(() => {
    return new Promise<ConnectResult>((resolve, reject) => {
      pendingRef.current = { resolve, reject }
      open({ view: 'Connect' })
    })
  }, [open])

  return connect
}
