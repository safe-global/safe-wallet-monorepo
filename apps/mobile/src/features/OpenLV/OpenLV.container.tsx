import { OpenLVView } from '@/src/features/OpenLV/components'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export const OpenLVContainer = () => {
  const activeSafe = useDefinedActiveSafe()
  return <OpenLVView activeSafe={activeSafe} />
}
