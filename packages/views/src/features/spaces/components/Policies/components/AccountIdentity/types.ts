import type { LinkProps } from '@safe-global/views/components/common/RouterLink'

export type AccountIdentityProps = {
  address: string
  name?: string
  showCopyButton?: boolean
  href?: LinkProps['href']
}
