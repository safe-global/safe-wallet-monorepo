import { AppRoutes } from '@/config/routes'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { NativeSwapsCardView } from '@views/components/safe-apps/NativeSwapsCard/NativeSwapsCardView'

type NativeSwapsCardProps = {
  onDismiss: () => void
}

const NativeSwapsCard = ({ onDismiss }: NativeSwapsCardProps) => {
  const safeLinkQuery = useSafeLinkQuery()

  return <NativeSwapsCardView swapHref={{ pathname: AppRoutes.swap, query: safeLinkQuery }} onDismiss={onDismiss} />
}

export default NativeSwapsCard
