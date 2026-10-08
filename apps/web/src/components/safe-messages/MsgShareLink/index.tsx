import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import CopyTooltip from '@/components/common/CopyTooltip'
import useOrigin from '@/hooks/useOrigin'
import { withSpaceIdInUrl, useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { MsgShareLinkView } from '@views/components/safe-messages/MsgShareLink/MsgShareLinkView'

const MsgShareLink = ({ safeMessageHash, button }: { safeMessageHash: string; button?: boolean }): ReactElement => {
  const router = useRouter()
  const { safe = '' } = router.query
  const spaceId = useUrlSpaceId()
  const href = withSpaceIdInUrl(`${AppRoutes.transactions.msg}?safe=${safe}&messageHash=${safeMessageHash}`, spaceId)
  const txUrl = useOrigin() + href

  return <MsgShareLinkView button={button} renderCopyTooltip={(props) => <CopyTooltip text={txUrl} {...props} />} />
}

export default MsgShareLink
