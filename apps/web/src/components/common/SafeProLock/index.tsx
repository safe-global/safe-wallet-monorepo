import NextLink, { type LinkProps } from 'next/link'
import { Lock } from 'lucide-react'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

/** Stands in for an action the plan does not include; what was set up before stays usable. */
const SafeProLock = ({ title, href }: { title: string; href: LinkProps['href'] }) => (
  <Alert variant="subtle" data-testid="safe-pro-lock">
    <Lock />
    <AlertTitle>
      <Typography variant="paragraph-bold">{highlightSafePro(title)}</Typography>
    </AlertTitle>
    <AlertDescription>
      <Typography>Existing ones stay active.</Typography>
      <Button size="action" render={<NextLink href={href} />}>
        Explore Safe Pro
      </Button>
    </AlertDescription>
  </Alert>
)

export default SafeProLock
