import { makeStore, setStoreInstance } from '@/store'
import { Provider } from 'react-redux'
import { useEffect, useState, type ReactNode } from 'react'
import type { StoryContext } from 'storybook/internal/csf'
import { setDarkMode } from '@/store/settingsSlice'
import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'

type StoreDecoratorProps = {
  initialState: Record<string, any>
  children: ReactNode
  context?: StoryContext
  /** Chain configs to put in the cache, so components that need them render complete in the first frame */
  chains?: Chain[]
}

export const StoreDecorator = ({ initialState, children, context, chains }: StoreDecoratorProps) => {
  const [store] = useState(() => {
    const newStore = makeStore(initialState)
    if (chains) {
      newStore.dispatch(
        apiSliceWithChainsConfig.util.upsertQueryEntries([
          {
            endpointName: 'getChainsConfigV2',
            arg: CONFIG_SERVICE_KEY,
            value: chainsAdapter.setAll(chainsAdapter.getInitialState(), chains),
          },
        ]),
      )
    }
    // Code outside React (e.g. getTransactionQueue) reads the store through getStoreInstance, as in _app.tsx
    setStoreInstance(newStore)
    return newStore
  })

  useEffect(() => {
    // Set the dark mode based on the theme from the context
    if (context?.globals?.theme) {
      store.dispatch(setDarkMode(context.globals.theme === 'dark'))
    }
  }, [context?.globals?.theme, store])

  return <Provider store={store}>{children}</Provider>
}
