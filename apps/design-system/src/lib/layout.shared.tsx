import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export const GITHUB_URL = 'https://github.com/safe-global/safe-wallet-monorepo/tree/dev/packages/ui'

export const baseOptions = (): BaseLayoutProps => ({
  nav: {
    title: <span className="font-semibold">Safe UI</span>,
  },
  githubUrl: GITHUB_URL,
})
