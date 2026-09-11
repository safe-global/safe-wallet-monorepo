import { Skeleton } from '@/components/ui/skeleton'

const WalletIcon = ({
  provider,
  width = 30,
  height = 30,
  icon,
}: {
  provider: string
  width?: number
  height?: number
  icon?: string
}) => {
  return icon ? (
    <img
      width={width}
      height={height}
      src={icon.startsWith('data:') ? icon : `data:image/svg+xml;utf8,${encodeURIComponent(icon)}`}
      alt={`${provider} logo`}
    />
  ) : (
    <Skeleton className="rounded-full" style={{ width, height }} />
  )
}

export default WalletIcon
