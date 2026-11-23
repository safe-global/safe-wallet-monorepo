import ExternalStore from '@safe-global/utils/services/ExternalStore'

const isOpenStore = new ExternalStore<boolean>(false)

const open = () => isOpenStore.setStore(true)

const close = () => isOpenStore.setStore(false)

export const useWorkspaceTourOpen = () => ({
  isOpen: isOpenStore.useStore() === true,
  open,
  close,
})
