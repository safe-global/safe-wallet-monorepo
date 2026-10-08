import type { FormEvent } from 'react'
import { PkModulePopupView } from '@views/services/private-key-module/PkModulePopupView'
import pkStore from './pk-popup-store'
const { useStore, setStore } = pkStore

const PkModulePopup = () => {
  const { isOpen, privateKey } = useStore() ?? { isOpen: false, privateKey: '' }

  const onClose = () => {
    setStore({ isOpen: false, privateKey })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const privateKey = (e.target as unknown as { 'private-key': HTMLInputElement })['private-key'].value

    setStore({
      isOpen: false,
      privateKey,
    })
  }

  return <PkModulePopupView isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} />
}

export default PkModulePopup
