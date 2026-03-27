import { createMMKV } from 'react-native-mmkv'
import { safeJsonParse, safeJsonStringify } from '@walletconnect/safe-json';
import { view } from './storybook.requires'

const mmkv = createMMKV({ id: 'storybook' })

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: async <T = any>(key: string): Promise<T | undefined> => {
      const item = mmkv.getString(key);
      if (typeof item === 'undefined' || item === null) {
        return undefined;
      }

      return safeJsonParse(item) as T;
    },
    setItem: async <T = any>(key: string, value: T) => {
      return mmkv.set(key, safeJsonStringify(value));
    },
  },
})

export default StorybookUIRoot
