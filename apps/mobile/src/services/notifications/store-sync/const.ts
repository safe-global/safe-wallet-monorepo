import { MMKV } from 'react-native-mmkv'

/**
 * Shared MMKV instance for extension storage
 *
 * Fun fact: it's named extensionStorage, because it was supposed to be used only in
 * ios's service extension. Now it is also used on Android, but in headless mode.
 */
export const extensionStorage = new MMKV({ id: 'extension' })
