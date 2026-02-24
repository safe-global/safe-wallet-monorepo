import { useEffect, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import AddressIdenticon from './AddressIdenticon'

interface EnsAddressIdenticonProps {
  address: string
  onAddressResolved: (address: string) => void
  children: ReactNode
}

const EnsAddressIdenticon = ({ address, onAddressResolved, children }: EnsAddressIdenticonProps) => {
  const { address: resolvedAddress, resolverError, resolving } = useNameResolver(address)

  useEffect(() => {
    if (resolvedAddress) {
      onAddressResolved(resolvedAddress)
    }
  }, [resolvedAddress, onAddressResolved])

  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {resolving ? (
            <div className="flex size-8 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AddressIdenticon address={address} />
          )}
        </div>
        {children}
      </div>

      {resolverError && <p className="pl-1 text-xs text-destructive">Failed to resolve ENS name</p>}
    </div>
  )
}

export default EnsAddressIdenticon
