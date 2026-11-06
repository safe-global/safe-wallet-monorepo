import { useState } from 'react'
import { LockdownBanner as LockdownBannerView } from '@safe-global/views/features/encrypted-workspaces/components/LockdownBanner'
import { isLockdown } from '../services'

const LockdownBanner = () => {
  const [isCopied, setIsCopied] = useState(false)

  if (!isLockdown()) return null

  const onCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => setIsCopied(true))
  }

  return <LockdownBannerView isCopied={isCopied} onCopyLink={onCopyLink} />
}

export default LockdownBanner
