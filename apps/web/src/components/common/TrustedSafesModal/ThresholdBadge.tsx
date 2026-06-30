import PeopleIcon from '@mui/icons-material/PeopleAltOutlined'

export const ThresholdBadge = ({ threshold, owners }: { threshold?: number; owners?: number }) => {
  if (!owners) return null

  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
      <PeopleIcon sx={{ fontSize: 12 }} />
      {threshold}/{owners}
    </span>
  )
}
