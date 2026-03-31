import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

const ThresholdBadge = ({ threshold, owners }: { threshold: number; owners: number }) => (
  <Badge variant="secondary" className="gap-1">
    <Users className="size-3" />
    {threshold}/{owners}
  </Badge>
)

export default ThresholdBadge
