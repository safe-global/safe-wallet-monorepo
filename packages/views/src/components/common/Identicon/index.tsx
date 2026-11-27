import type { ReactElement, CSSProperties } from 'react'
import { useMemo } from 'react'
import { blo } from 'blo'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'

import css from './styles.module.css'
import { isAddress } from 'ethers'

export interface IdenticonProps {
  address: string
  size?: number
}

export const getIdenticonSrc = (address: string): string | undefined => {
  try {
    if (!isAddress(address)) {
      return undefined
    }
    return blo(address as `0x${string}`)
  } catch {
    return undefined
  }
}

const Identicon = ({ address, size = 40 }: IdenticonProps): ReactElement => {
  const style = useMemo<CSSProperties | null>(() => {
    const src = getIdenticonSrc(address)
    if (!src) {
      return null
    }
    return {
      backgroundImage: `url(${src})`,
      width: `${size}px`,
      height: `${size}px`,
    }
  }, [address, size])

  return !style ? (
    <Skeleton className="rounded-full" style={{ width: size, height: size }} />
  ) : (
    <div className={css.icon} style={style} />
  )
}

export default Identicon
