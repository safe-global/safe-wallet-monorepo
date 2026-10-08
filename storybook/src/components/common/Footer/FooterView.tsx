import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { Github } from 'lucide-react'
import NextLink from 'next/link'
import css from './styles.module.css'
import ExternalLink from '@views/components/common/ExternalLink'
import { Link } from '@/components/ui/link'
import { HELP_CENTER_URL, PRIVACY_URL } from '@safe-global/utils/config/constants'

export type FooterViewProps = {
  isOfficialHost: boolean
  copyrightYear: string | number
  legalUrl: string
  licensesHref: string
  imprintHref: string
  cookieHref: string
  preferencesHref: string
  preferences: boolean
  versionIcon: boolean
  helpCenter: boolean
  footerClassName?: string
  appVersion: string
  appHomepage: string
  commitHash?: string
}

const FooterLink = ({ children, href }: { children: ReactNode; href: string }): ReactElement => {
  return href ? <Link render={<NextLink href={href} />}>{children}</Link> : <Link>{children}</Link>
}

export function FooterView({
  isOfficialHost,
  copyrightYear,
  legalUrl,
  licensesHref,
  imprintHref,
  cookieHref,
  preferencesHref,
  preferences,
  versionIcon,
  helpCenter,
  footerClassName = css.container,
  appVersion,
  appHomepage,
  commitHash,
}: FooterViewProps): ReactElement {
  return (
    <footer className={footerClassName}>
      <ul>
        {isOfficialHost ? (
          <>
            <li>
              <Typography variant="paragraph-mini">&copy;{copyrightYear} Safe Labs GmbH</Typography>
            </li>
            <li>
              <ExternalLink href={legalUrl} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
                Legal
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={PRIVACY_URL} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
                Privacy
              </ExternalLink>
            </li>
            <li>
              <FooterLink href={licensesHref}>Licenses</FooterLink>
            </li>
            <li>
              <FooterLink href={imprintHref}>Imprint</FooterLink>
            </li>
            <li>
              <FooterLink href={cookieHref}>Cookie policy</FooterLink>
            </li>
            {preferences && (
              <li>
                <FooterLink href={preferencesHref}>Preferences</FooterLink>
              </li>
            )}
            {helpCenter && (
              <li>
                <ExternalLink
                  href={HELP_CENTER_URL}
                  noIcon
                  className="[&_span]:underline [&_span]:decoration-primary/40"
                >
                  Help
                </ExternalLink>
              </li>
            )}
          </>
        ) : (
          <li>This is an unofficial distribution of the app</li>
        )}

        <li>
          <ExternalLink href={`${appHomepage}/releases/tag/web-v${appVersion}`} noIcon>
            {versionIcon && <Github className="mr-1 inline size-3" />}v{appVersion}
          </ExternalLink>
        </li>

        {commitHash && (
          <li>
            <ExternalLink href={`${appHomepage}/commit/${commitHash}`} noIcon>
              {commitHash.slice(0, 7)}
            </ExternalLink>
          </li>
        )}
      </ul>
    </footer>
  )
}
