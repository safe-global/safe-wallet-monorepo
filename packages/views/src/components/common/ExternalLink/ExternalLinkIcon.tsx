import { createContext, useContext, type ReactNode, type ComponentType } from 'react'
import { ArrowUpRight, ExternalLink as BoxedExternalLink } from 'lucide-react'

const PlainIconContext = createContext(false)

/** Scope the transaction flow's plain outbound arrow to links inside its dialog. */
export const PlainExternalLinkIcons = ({ children }: { children: ReactNode }) => (
  <PlainIconContext.Provider value>{children}</PlainIconContext.Provider>
)

export const ExternalLinkIcon = ({
  className,
  fallback = BoxedExternalLink,
  'aria-hidden': ariaHidden,
}: {
  className?: string
  fallback?: ComponentType<{ className?: string }>
  'aria-hidden'?: boolean
}) => {
  const plain = useContext(PlainIconContext)
  const Icon = plain ? ArrowUpRight : fallback
  return <Icon className={className} {...(ariaHidden === undefined ? {} : { 'aria-hidden': ariaHidden })} />
}
