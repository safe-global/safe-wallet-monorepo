import {
  ActivityIcon,
  ArrowUpRight,
  BookOpen,
  Building2,
  Cookie,
  FileText,
  Github,
  LifeBuoy,
  Scale,
  Settings2,
  Shield,
} from 'lucide-react'
import { useAppDispatch } from '@/store'
import { openCookieBanner } from '@/store/popupSlice'
import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'
import { APP_HOMEPAGE, APP_VERSION } from '@/config/version'
import { BRAND_NAME } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'

const STATUS_PAGE_URL = 'https://status.safe.global'
const RELEASE_URL = `${APP_HOMEPAGE}/releases/tag/web-v${APP_VERSION}`

type LegalLink = {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  external?: boolean
}

const LEGAL_LINKS: LegalLink[] = [
  {
    title: 'Terms of use',
    description: 'Conditions for using Safe{Wallet}',
    href: AppRoutes.terms,
    icon: <FileText className="h-4 w-4 text-muted-foreground" />,
    external: true,
  },
  {
    title: 'Privacy policy',
    description: 'What we collect and why',
    href: AppRoutes.privacy,
    icon: <Shield className="h-4 w-4 text-muted-foreground" />,
    external: true,
  },
  {
    title: 'Licenses',
    description: 'Open source attribution',
    href: AppRoutes.licenses,
    icon: <Scale className="h-4 w-4 text-muted-foreground" />,
    external: true,
  },
  {
    title: 'Imprint',
    description: 'Safe Ecosystem Foundation',
    href: AppRoutes.imprint,
    icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
    external: true,
  },
  {
    title: 'Cookie policy',
    description: 'How cookies are used',
    href: AppRoutes.cookie,
    icon: <Cookie className="h-4 w-4 text-muted-foreground" />,
    external: true,
  },
]

const LinkRow = ({
  href,
  icon,
  title,
  description,
  external = false,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: React.ReactNode
  external?: boolean
}) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noreferrer noopener' : undefined}
    className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground no-underline transition-colors hover:bg-muted/60"
  >
    <span className="shrink-0">{icon}</span>
    <span className="flex-1 min-w-0">
      <Typography variant="paragraph-small-bold" className="block">
        {title}
      </Typography>
      <Typography variant="paragraph-mini" color="muted" className="block mt-0.5">
        {description}
      </Typography>
    </span>
    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
  </a>
)

const AboutPage = () => {
  const dispatch = useAppDispatch()

  const handleCookiePrefs = () => {
    dispatch(openCookieBanner({ warningKey: CookieAndTermType.NECESSARY }))
  }

  return (
    <div data-testid="settings-about-page">
      {/* Version */}
      <section className="bg-card rounded-2xl p-6 mb-4">
        <Typography variant="paragraph-bold" className="mb-4 block">
          Version
        </Typography>

        <a
          href={RELEASE_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 no-underline"
          aria-label={`View release notes for v${APP_VERSION}`}
        >
          <Badge variant="secondary" className="h-6 px-2.5 text-sm font-mono">
            v{APP_VERSION}
          </Badge>
          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-semibold">
            Release notes
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </a>

        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border">
          <span className="flex items-center gap-3 min-w-0">
            <Github className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="min-w-0">
              <Typography variant="paragraph-small-bold" className="block">
                Open source
              </Typography>
              <Typography variant="paragraph-mini" color="muted" className="block mt-0.5">
                {BRAND_NAME} is fully open source.
              </Typography>
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            render={<a href={APP_HOMEPAGE} target="_blank" rel="noreferrer noopener" />}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            GitHub
          </Button>
        </div>
      </section>

      {/* Legal & policies */}
      <section className="bg-card rounded-2xl p-6 mb-4">
        <Typography variant="paragraph-bold" className="mb-4 block">
          Legal &amp; policies
        </Typography>

        <div className="grid grid-cols-1 sm:grid-cols-2 -mx-2">
          {LEGAL_LINKS.map((link) => (
            <LinkRow key={link.title} {...link} />
          ))}
          <button
            type="button"
            onClick={handleCookiePrefs}
            data-testid="cookie-preferences-button"
            className="flex items-center gap-3 px-3 py-3 rounded-md text-foreground text-left transition-colors hover:bg-muted/60 cursor-pointer"
          >
            <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 min-w-0">
              <Typography variant="paragraph-small-bold" className="block">
                Cookie preferences
              </Typography>
              <Typography variant="paragraph-mini" color="muted" className="block mt-0.5">
                Manage what&apos;s enabled
              </Typography>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>
        </div>
      </section>

      {/* Help & community */}
      <section className="bg-card rounded-2xl p-6 mb-4">
        <Typography variant="paragraph-bold" className="mb-4 block">
          Help &amp; community
        </Typography>

        <div className="flex flex-col -mx-2">
          <LinkRow
            href={HELP_CENTER_URL}
            external
            icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
            title="Help center"
            description="Guides, FAQs, and troubleshooting."
          />
          <LinkRow
            href={STATUS_PAGE_URL}
            external
            icon={<ActivityIcon className="h-4 w-4 text-green-600" />}
            title="Service status"
            description={
              <span>
                <span className="text-green-600 font-semibold">●</span> All systems operational
              </span>
            }
          />
          <LinkRow
            href={HELP_CENTER_URL}
            external
            icon={<LifeBuoy className="h-4 w-4 text-muted-foreground" />}
            title="Contact support"
            description="Get help from our team."
          />
        </div>
      </section>
    </div>
  )
}

export default AboutPage
