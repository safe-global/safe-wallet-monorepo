import type { MouseEvent, ReactElement } from 'react'
import type { UrlObject } from 'url'
import { useRouter } from 'next/router'
import { ParentSafeWalletNoticeView } from '@views/features/spaces/components/Policies/components/ParentSafeWalletNoticeView'

export type ParentSafeWalletCopy = {
  title: string
  /** Completes "To … on its behalf", e.g. "grant this role". */
  action: string
}

export type ParentSafeWalletNoticeProps = ParentSafeWalletCopy & {
  safeName: string
  parentSafeName: string
  settingsHref?: UrlObject
  onNavigate?: () => void
}

const ParentSafeWalletNotice = ({
  title,
  action,
  safeName,
  parentSafeName,
  settingsHref,
  onNavigate,
}: ParentSafeWalletNoticeProps): ReactElement => {
  const router = useRouter()

  const goToSettings = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onNavigate?.()
    if (settingsHref) void router.push(settingsHref)
  }

  return (
    <ParentSafeWalletNoticeView
      title={title}
      action={action}
      safeName={safeName}
      parentSafeName={parentSafeName}
      settingsHref={settingsHref}
      onGoToSettings={goToSettings}
    />
  )
}

export default ParentSafeWalletNotice
