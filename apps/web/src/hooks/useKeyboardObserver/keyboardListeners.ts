export enum KeyboardAction {
  GLOBAL_SEARCH = 'GLOBAL_SEARCH',
}

type KeyboardListener = (event: KeyboardEvent) => KeyboardAction | undefined

const globalSearchListener: KeyboardListener = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    return KeyboardAction.GLOBAL_SEARCH
  }
}

export const listeners: KeyboardListener[] = [globalSearchListener]
