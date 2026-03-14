import type { ComponentType } from 'react'

export type AppProps = {
  Component: ComponentType<Record<string, unknown>>
  pageProps: Record<string, unknown>
  router: {
    query: Record<string, string | string[] | undefined>
    pathname: string
  }
}
