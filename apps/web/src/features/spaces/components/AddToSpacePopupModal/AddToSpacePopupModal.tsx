import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { AddToSpacePopupModalView } from '@views/features/spaces/components/AddToSpacePopupModal/AddToSpacePopupModalView'

export const AddToSpacePopupModal = (): ReactElement => {
  const router = useRouter()
  const safe = useSafeQueryParam()
  // eslint-disable-next-line no-restricted-syntax -- The Workspace to create does not exist yet
  const createSpaceHref = { pathname: AppRoutes.spaces.createSpace, query: { safe } }

  return <AddToSpacePopupModalView onCreateSpace={() => void router.push(createSpaceHref)} />
}
