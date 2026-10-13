import type { LinkProps } from 'next/link'

export type AccountIdentityProps = {
  address: string
  name?: string
  showCopyButton?: boolean
  href?: LinkProps['href']
}
