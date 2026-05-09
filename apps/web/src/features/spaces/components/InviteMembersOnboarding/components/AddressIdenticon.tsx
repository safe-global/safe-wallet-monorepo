import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { blo } from 'blo'

const IDENTICON_SIZE = 32

const AddressIdenticon = ({ address }: { address: string }) => {
  const style = useMemo(() => {
    try {
      if (!isAddress(address)) return null
      return {
        backgroundImage: `url(${blo(address as `0x${string}`)})`,
        width: `${IDENTICON_SIZE}px`,
        height: `${IDENTICON_SIZE}px`,
      }
    } catch {
      return null
    }
  }, [address])

  if (!style) {
    return <div className="size-8 shrink-0 rounded-full bg-muted" />
  }

  return <div className="size-8 shrink-0 rounded-full bg-cover" style={style} />
}

export default AddressIdenticon
