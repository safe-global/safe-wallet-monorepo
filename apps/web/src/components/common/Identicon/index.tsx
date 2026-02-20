import type { ReactElement, CSSProperties } from 'react'
import { useMemo } from 'react'
import { blo } from 'blo'
import Skeleton from '@mui/material/Skeleton'

import css from './styles.module.css'
import { isAddress } from 'ethers'

export interface IdenticonProps {
  address: string
  size?: number
}

const Identicon = ({ address, size = 40 }: IdenticonProps): ReactElement => {
  const style = useMemo<CSSProperties | null>(() => {
    try {
      if (!isAddress(address)) {
        return null
      }
      const blockie = blo(address as `0x${string}`)
      return {
        backgroundImage: `url(${blockie})`,
        width: `${size}px`,
        height: `${size}px`,
      }
    } catch (e) {
      return null
    }
  }, [address, size])

  return !style ? (
    <Skeleton variant="circular" width={size} height={size} />
  ) : (
    <div className={css.icon} style={style} />
  )
}

export default Identicon
