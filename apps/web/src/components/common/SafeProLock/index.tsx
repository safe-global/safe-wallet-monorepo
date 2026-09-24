import NextLink, { type LinkProps } from 'next/link'
import { Lock } from 'lucide-react'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

/** Stands in for an action the plan does not include; what was set up before stays usable. */
const SafeProLock = ({ title, href }: { title: string; href: LinkProps['href'] }) => (
  <Alert variant="subtle" data-testid="safe-pro-lock">
    <Lock />
    <AlertTitle>{highlightSafePro(title)}</AlertTitle>
    <AlertDescription>
      <p>Existing ones stay active.</p>
      <Button size="sm" render={<NextLink href={href} />}>
        Explore Safe Pro
      </Button>
    </AlertDescription>
  </Alert>
)

export default SafeProLock
