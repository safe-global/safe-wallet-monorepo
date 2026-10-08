import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { blo } from 'blo'
import { isAddress } from 'ethers'
import { IdenticonView } from '@views/components/common/Identicon/IdenticonView'

export interface IdenticonProps {
  address: string
  size?: number
}

const Identicon = ({ address, size = 40 }: IdenticonProps): ReactElement => {
  const blockie = useMemo<string | null>(() => {
    try {
      if (!isAddress(address)) {
        return null
      }
      return blo(address as `0x${string}`)
    } catch (e) {
      return null
    }
  }, [address])

  return <IdenticonView blockie={blockie} size={size} />
}

export default Identicon
