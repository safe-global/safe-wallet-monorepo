import type { ComponentPropsWithoutRef } from 'react'
import type { LinkProps as NextLinkProps } from 'next/dist/client/link'
import NextLink from 'next/link'
import { Link } from '@/components/ui/link'

const CustomLink: React.FC<
  React.PropsWithChildren<Omit<ComponentPropsWithoutRef<'a'>, 'href'> & Pick<NextLinkProps, 'href' | 'as'>>
> = ({ href = '', as, children, ...other }) => {
  const isExternal = href.toString().startsWith('http')
  return (
    <Link render={<NextLink href={href} as={as} target={isExternal ? '_blank' : ''} rel="noreferrer" />} {...other}>
      {children}
    </Link>
  )
}

export default CustomLink
