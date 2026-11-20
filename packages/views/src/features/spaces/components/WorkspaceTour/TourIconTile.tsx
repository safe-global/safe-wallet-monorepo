import type { LucideIcon } from 'lucide-react'

const TourIconTile = ({ icon: Icon }: { icon: LucideIcon }) => (
  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
    <Icon className="size-4" aria-hidden />
  </div>
)

export default TourIconTile
