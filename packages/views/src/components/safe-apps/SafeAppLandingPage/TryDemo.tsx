import { CTA_HEIGHT, CTA_BUTTON_WIDTH } from '@safe-global/views/components/safe-apps/SafeAppLandingPage/constants'
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import DemoAppSVG from '@safe-global/views/assets/images/apps/apps-demo.svg'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Button } from '@safe-global/views/components/ui/button'

type Props = {
  demoUrl: LinkProps['href']
  onClick(): void
}

const TryDemo = ({ demoUrl, onClick }: Props) => (
  <div className="flex flex-col items-center justify-between" style={{ height: CTA_HEIGHT }}>
    <Typography variant="paragraph-bold">Try the Safe App before using it</Typography>
    <DemoAppSVG alt="An icon of a internet browser" />
    <Button variant="outline" style={{ width: CTA_BUTTON_WIDTH }} onClick={onClick} render={<Link href={demoUrl} />}>
      Try demo
    </Button>
  </div>
)

export { TryDemo }
