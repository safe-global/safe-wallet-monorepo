import type { NextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { type ReactNode } from 'react'

export const createMockRouter = (props: Partial<NextRouter> = {}): NextRouter => ({
  asPath: '/',
  basePath: '/',
  back: async () => true,
  beforePopState: () => true,
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
  isFallback: false,
  isLocaleDomain: true,
  isPreview: false,
  isReady: true,
  pathname: '/',
  push: async () => true,
  prefetch: async () => {},
  reload: async () => true,
  replace: async () => true,
  route: '/',
  query: {},
  forward: () => void 0,
  ...props,
})

type RouterDecoratorProps = {
  router?: Partial<NextRouter>
  children: ReactNode
}

export const RouterDecorator = ({ router, children }: RouterDecoratorProps) => {
  const mockRouter = createMockRouter(router)
  return <RouterContext.Provider value={mockRouter}>{children}</RouterContext.Provider>
}
