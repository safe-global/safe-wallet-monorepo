import { Typography } from '@/components/ui/typography'

type SafeAppsListHeaderProps = {
  title: string
  amount?: number
}

const SafeAppsListHeader = ({ title, amount }: SafeAppsListHeaderProps) => {
  return (
    <Typography
      variant="paragraph-small-bold"
      className="mt-[var(--space-3)] mb-[var(--space-2)] text-[var(--color-primary-light)]"
    >
      {title} ({amount || 0})
    </Typography>
  )
}

export default SafeAppsListHeader
