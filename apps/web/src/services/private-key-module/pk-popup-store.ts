import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { sessionItem } from '@/services/local-storage/session'

type PkModulePopupStore = {
  isOpen: boolean
  privateKey: string
}

const defaultValue = {
  isOpen: false,
  privateKey: '',
}

const STORAGE_KEY = 'privateKeyModulePK'
const pkStorage = sessionItem<PkModulePopupStore>(STORAGE_KEY)

const popupStore = new ExternalStore<PkModulePopupStore>(pkStorage.get() || defaultValue)

popupStore.subscribe(() => {
  pkStorage.set(popupStore.getStore() || defaultValue)
})

export default popupStore
