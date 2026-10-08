import NextLink, { type LinkProps } from 'next/link'
import { Lock } from 'lucide-react'
import type { ReactElement } from 'react'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export type SafeProLockViewProps = {
  title: string
  href: LinkProps['href']
  onExplore: () => void
}

export function SafeProLockView({ title, href, onExplore }: SafeProLockViewProps): ReactElement {
  return (
    <Alert variant="subtle" data-testid="safe-pro-lock">
      <Lock />
      <AlertTitle>
        <Typography variant="paragraph-bold">{highlightSafePro(title)}</Typography>
      </AlertTitle>
      <AlertDescription>
        <Typography>Existing ones stay active.</Typography>
        <Button size="action" render={<NextLink href={href} />} onClick={onExplore}>
          Explore Safe Pro
        </Button>
      </AlertDescription>
    </Alert>
  )
}
