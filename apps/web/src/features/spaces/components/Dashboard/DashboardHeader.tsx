import { ActionsTray } from '@/features/actions-tray'
import { DashboardHeaderView } from '@views/features/spaces/components/Dashboard/DashboardHeaderView'

/** Dashboard header with the Total value display and primary action buttons. */

interface DashboardHeaderProps {
  value: string
  loading?: boolean
  onSend?: () => void
  onReceive?: () => void
  onSwap?: () => void
  onBuildTransaction?: () => void
  otherActions?: React.ReactNode
  noAssets: boolean
}

const DashboardHeader = ({ value, loading, noAssets }: DashboardHeaderProps) => {
  return (
    <DashboardHeaderView
      value={value}
      loading={loading}
      renderActionsTray={(props) => <ActionsTray {...props} noAssets={noAssets} />}
    />
  )
}

export { DashboardHeader }
