import { Typography } from '@/components/ui/typography'

type SafeAppsListHeaderProps = {
  title: string
  amount?: number
}

const SafeAppsListHeader = ({ title, amount }: SafeAppsListHeaderProps) => {
  return (
    <Typography
      as="h2"
      variant="paragraph-small-bold"
      className="mt-[var(--space-4)] mb-[var(--space-3)] text-[var(--color-primary-light)]"
    >
      {title} ({amount || 0})
    </Typography>
  )
}

export default SafeAppsListHeader
