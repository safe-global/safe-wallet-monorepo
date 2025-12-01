import { makeStore } from '@/store'
import { Provider } from 'react-redux'
import { useEffect, type ReactNode } from 'react'
import type { StoryContext } from 'storybook/internal/csf'
import { setDarkMode } from '@/store/settingsSlice'

type StoreDecoratorProps = {
  initialState: Record<string, any>
  children: ReactNode
  context?: StoryContext
}

export const StoreDecorator = ({ initialState, children, context }: StoreDecoratorProps) => {
  const store = makeStore(initialState)

  useEffect(() => {
    // Set the dark mode based on the theme from the context
    if (context?.globals?.theme) {
      store.dispatch(setDarkMode(context.globals.theme === 'dark'))
    }
  }, [context?.globals?.theme, store])

  return <Provider store={store}>{children}</Provider>
}
