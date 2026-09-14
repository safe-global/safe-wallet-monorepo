import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import AuthState from '../AuthState'

export default function SpacePlansPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()
  const { SafeProAnnouncement } = useLoadFeature(SafeProFeature)

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
          Plans
        </Typography>

        <Card
          size="none"
          // eslint-disable-next-line no-restricted-syntax -- Figma spec calls for a 32px corner one-off; no radius token in the scale matches it
          className="w-full rounded-[2rem]"
        >
          <SafeProAnnouncement location="plans_page" />
        </Card>
      </div>
    </AuthState>
  )
}
