import { useState, useCallback } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

type ModalState =
  | {
      isOpen: false
      app: null
    }
  | {
      isOpen: true
      app: SafeAppData
    }

type ReturnType = { state: ModalState; open: (app: SafeAppData) => void; close: () => void }

const useRemoveAppModal = (): ReturnType => {
  const [state, setState] = useState<ModalState>({ isOpen: false, app: null })

  const open = useCallback((app: SafeAppData) => {
    setState({ isOpen: true, app })
  }, [])

  const close = useCallback(() => setState(() => ({ isOpen: false, app: null })), [])

  return { state, open, close }
}

export { useRemoveAppModal }
