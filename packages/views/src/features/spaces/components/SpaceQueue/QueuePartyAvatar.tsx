import type { ReactElement } from 'react'
import Identicon from '@safe-global/views/components/common/Identicon'
import ImageFallback from '@safe-global/views/components/common/ImageFallback'

/** A party's logo, or its identicon when it has none or the logo fails to load */
const QueuePartyAvatar = ({
  address,
  logoUri,
  size,
}: {
  address: string
  logoUri?: string | null
  size: number
}): ReactElement => {
  const identicon = <Identicon address={address} size={size} />
  return logoUri ? (
    <ImageFallback
      src={logoUri}
      fallbackComponent={identicon}
      alt=""
      className="shrink-0 rounded-full"
      style={{ width: size, height: size }}
    />
  ) : (
    identicon
  )
}

export default QueuePartyAvatar
