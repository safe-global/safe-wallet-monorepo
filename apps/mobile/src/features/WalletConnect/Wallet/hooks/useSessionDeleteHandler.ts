import { useEffect } from 'react'
import type { IWalletKit } from '@reown/walletkit'
import { useAppDispatch } from '@/src/store/hooks'
import { removeSession, setSessions } from '../store/walletKitSlice'

export const useSessionDeleteHandler = (walletKit: IWalletKit | null) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!walletKit) {
      return
    }

    const refresh = () => {
      const active = walletKit.getActiveSessions()
      dispatch(setSessions(active))
    }

    const onDelete = ({ topic }: { topic: string }) => {
      dispatch(removeSession(topic))
    }

    walletKit.on('session_delete', onDelete)
    walletKit.on('proposal_expire', refresh)

    return () => {
      walletKit.off('session_delete', onDelete)
      walletKit.off('proposal_expire', refresh)
    }
  }, [walletKit, dispatch])
}
