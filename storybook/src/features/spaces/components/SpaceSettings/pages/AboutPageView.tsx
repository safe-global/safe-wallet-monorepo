import type { ReactNode } from 'react'
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
import { AppRoutes } from '@/config/routes'
import { HELP_CENTER_URL, PRIVACY_URL, TERMS_URL } from '@safe-global/utils/config/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

const STATUS_PAGE_URL = 'https://status.safe.global'
const ROW_BUTTON_CLASSNAME =
  'group flex h-auto w-full justify-start gap-3 whitespace-normal rounded-md px-3 py-3 text-left font-normal text-foreground hover:bg-muted/60'

type LegalLink = {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  external?: boolean
}

const proChip = (
  <span className="block h-4 w-6">
    <ProChip className="size-full" />
  </span>
)

const getSafeProLegalLinks = (safeProUserTermsUrl: string, safeProTermsUrl: string): LegalLink[] => [
  {
    title: 'Pro User Terms & Conditions',
    description: 'For using Safe Pro',
    href: safeProUserTermsUrl,
    icon: proChip,
    external: true,
  },
  {
    title: 'Pro Terms & Conditions',
    description: 'For using Safe Pro',
    href: safeProTermsUrl,
    icon: proChip,
    external: true,
  },
]

const LEGAL_LINKS: LegalLink[] = [
  {
    title: 'Terms & Conditions',
    description: 'For using Safe{Wallet}',
    href: TERMS_URL,
    icon: <FileText className="h-4 w-4 text-muted-foreground" />,
    external: true,
  },
  {
    title: 'Privacy Policy',
    description: 'What we collect and why',
    href: PRIVACY_URL,
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
    description: 'Safe Labs GmbH',
    href: AppRoutes.imprint,
    icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
    external: true,
  },
  {
    title: 'Cookie Policy',
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
    className="group flex items-center gap-3 px-3 py-3 rounded-md text-foreground no-underline transition-colors hover:bg-muted/60"
  >
    <span className="shrink-0 transition-colors [&_svg]:transition-colors [&_svg]:group-hover:text-accent-success">
      {icon}
    </span>
    <span className="flex-1 min-w-0">
      <Typography variant="paragraph-small-bold" className="block transition-colors group-hover:text-accent-success">
        {title}
      </Typography>
      <Typography variant="paragraph-mini" color="muted" className="block mt-0.5">
        {description}
      </Typography>
    </span>
    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-colors group-hover:text-accent-success" />
  </a>
)

export type AboutPageViewProps = {
  appVersion: string
  appHomepage: string
  brandName: string
  safeProUserTermsUrl: string
  safeProTermsUrl: string
  showSupport: boolean
  showSafeProLinks: boolean
  onContactSupport: () => void
  onCookiePrefs: () => void
  supportDrawer: ReactNode
}

export const AboutPageView = ({
  appVersion,
  appHomepage,
  brandName,
  safeProUserTermsUrl,
  safeProTermsUrl,
  showSupport,
  showSafeProLinks,
  onContactSupport,
  onCookiePrefs,
  supportDrawer,
}: AboutPageViewProps) => {
  const releaseUrl = `${appHomepage}/releases/tag/web-v${appVersion}`
  const legalLinks = showSafeProLinks
    ? [...getSafeProLegalLinks(safeProUserTermsUrl, safeProTermsUrl), ...LEGAL_LINKS]
    : LEGAL_LINKS

  return (
    <div data-testid="settings-about-page">
      {/* Help */}
      <SpaceSettingsSection>
        <SpaceSettingsSectionTitle>Help</SpaceSettingsSectionTitle>

        <div className="flex flex-col -mx-2">
          <LinkRow
            href={HELP_CENTER_URL}
            external
            icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
            title="Help Center"
            description="Guides, FAQs, and troubleshooting"
          />
          <LinkRow
            href={STATUS_PAGE_URL}
            external
            icon={<ActivityIcon className="h-4 w-4 text-muted-foreground" />}
            title="Sync Status"
            description="Blockchain sync status across networks"
          />
          {showSupport && (
            <Button type="button" variant="ghost" onClick={onContactSupport} className={ROW_BUTTON_CLASSNAME}>
              <span className="shrink-0">
                <LifeBuoy className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent-success" />
              </span>
              <span className="flex-1 min-w-0">
                <Typography
                  variant="paragraph-small-bold"
                  className="block transition-colors group-hover:text-accent-success"
                >
                  Contact Support
                </Typography>
                <Typography variant="paragraph-mini" color="muted" className="block mt-0.5">
                  Get help from our team
                </Typography>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-colors group-hover:text-accent-success" />
            </Button>
          )}
        </div>
      </SpaceSettingsSection>

      <SpaceSettingsSection>
        <SpaceSettingsSectionTitle>Legal &amp; Policies</SpaceSettingsSectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 -mx-2">
          {legalLinks.map((link) => (
            <LinkRow key={link.title} {...link} />
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={onCookiePrefs}
            data-testid="cookie-preferences-button"
            className={ROW_BUTTON_CLASSNAME}
          >
            <Settings2 className="h-4 w-4 text-muted-foreground shrink-0 transition-colors group-hover:text-accent-success" />
            <span className="flex-1 min-w-0">
              <Typography
                variant="paragraph-small-bold"
                className="block transition-colors group-hover:text-accent-success"
              >
                Cookie Preferences
              </Typography>
              <Typography variant="paragraph-mini" color="muted" className="block mt-0.5">
                Manage what&apos;s enabled
              </Typography>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-colors group-hover:text-accent-success" />
          </Button>
        </div>
      </SpaceSettingsSection>

      {/* Version */}
      <SpaceSettingsSection>
        <SpaceSettingsSectionTitle>Version</SpaceSettingsSectionTitle>

        <a
          href={releaseUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 no-underline"
          aria-label={`View release notes for v${appVersion}`}
        >
          <Badge variant="secondary" size="lg" className="font-mono">
            v{appVersion}
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
                {brandName} is fully open source
              </Typography>
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            render={<a href={appHomepage} target="_blank" rel="noreferrer noopener" />}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            GitHub
          </Button>
        </div>
      </SpaceSettingsSection>

      {showSupport && supportDrawer}
    </div>
  )
}
