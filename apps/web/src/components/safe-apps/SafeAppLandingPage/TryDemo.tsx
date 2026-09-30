import { CTA_HEIGHT, CTA_BUTTON_WIDTH } from '@/components/safe-apps/SafeAppLandingPage/constants'
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import DemoAppSVG from '@/public/images/apps/apps-demo.svg'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'

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
