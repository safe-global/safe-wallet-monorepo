import type { ReactElement, CSSProperties } from 'react'
import { useState, useEffect } from 'react'
import Skeleton from '@mui/material/Skeleton'

import css from './styles.module.css'
import { isAddress } from 'ethers'
import { generateGradient } from '@/utils/gradientAvatar'

export interface IdenticonProps {
  address: string
  size?: number
}

const Identicon = ({ address, size = 40 }: IdenticonProps): ReactElement => {
  const [style, setStyle] = useState<CSSProperties | null>(null)

  useEffect(() => {
    if (!isAddress(address)) {
      setStyle(null)
      return
    }

    generateGradient(address)
      .then(({ fromColor, toColor }) => {
        setStyle({
          background: `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`,
          width: `${size}px`,
          height: `${size}px`,
        })
      })
      .catch(() => {
        setStyle(null)
      })
  }, [address, size])

  return !style ? (
    <Skeleton variant="circular" width={size} height={size} />
  ) : (
    <div className={css.icon} style={style} />
  )
}

export default Identicon
