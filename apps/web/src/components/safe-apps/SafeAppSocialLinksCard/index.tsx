import NextLink from 'next/link'
import { HelpCircle, Github, Send, Twitter } from 'lucide-react'
import { SafeAppSocialPlatforms } from '@safe-global/store/gateway/types'
import type { SafeApp as SafeAppData, SafeAppSocialProfile } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/components/ui/link'
import DiscordIcon from '@/public/images/common/discord-icon.svg'
import css from './styles.module.css'

type SafeAppSocialLinksCardProps = {
  safeApp: SafeAppData
}

const SafeAppSocialLinksCard = ({ safeApp }: SafeAppSocialLinksCardProps) => {
  const { socialProfiles, developerWebsite } = safeApp

  const hasSocialLinks = socialProfiles?.length > 0

  if (!hasSocialLinks && !developerWebsite) {
    return null
  }

  const discordSocialLink = getSocialProfile(socialProfiles, SafeAppSocialPlatforms.DISCORD)
  const twitterSocialLink = getSocialProfile(socialProfiles, SafeAppSocialPlatforms.TWITTER)
  const githubSocialLink = getSocialProfile(socialProfiles, SafeAppSocialPlatforms.GITHUB)
  const telegramSocialLink = getSocialProfile(socialProfiles, SafeAppSocialPlatforms.TELEGRAM)

  return (
    <Card className={css.container}>
      <div className="flex items-center gap-2">
        {/* Team Link section */}
        <div className={css.questionMarkIcon}>
          <HelpCircle className="size-6 text-[var(--color-info-main)]" />
        </div>
        <div>
          <Typography variant="paragraph-bold">Something wrong with the Safe App?</Typography>
          <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
            Get in touch with the team
          </Typography>
        </div>
      </div>

      <div className={`${css.socialLinksSectionContainer} flex gap-8`}>
        {/* Social links section */}
        {hasSocialLinks && (
          <div>
            <Typography variant="paragraph-small" className="pl-2 text-[var(--color-border-main)]">
              Social Media
            </Typography>

            <div className="mt-0.5 flex min-h-[40px]">
              {discordSocialLink && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Discord link"
                  render={<a target="_blank" rel="noopener noreferrer" href={discordSocialLink.url} />}
                >
                  <DiscordIcon />
                </Button>
              )}

              {twitterSocialLink && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Twitter link"
                  render={<a target="_blank" rel="noopener noreferrer" href={twitterSocialLink.url} />}
                >
                  <Twitter className="text-[var(--color-border-main)]" />
                </Button>
              )}

              {githubSocialLink && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Github link"
                  render={<a target="_blank" rel="noopener noreferrer" href={githubSocialLink.url} />}
                >
                  <Github className="text-[var(--color-border-main)]" />
                </Button>
              )}

              {telegramSocialLink && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Telegram link"
                  render={<a target="_blank" rel="noopener noreferrer" href={telegramSocialLink.url} />}
                >
                  <Send className="text-[var(--color-border-main)]" />
                </Button>
              )}
            </div>
          </div>
        )}

        {hasSocialLinks && developerWebsite && <Separator orientation="vertical" className="h-[40px]" />}

        {/* Developer website section */}
        {developerWebsite && (
          <div className="flex flex-col">
            <Typography variant="paragraph-small" className="text-[var(--color-border-main)]">
              Website
            </Typography>

            <Link
              className={`${css.websiteLink} mt-1 font-bold`}
              render={<NextLink href={developerWebsite} target="_blank" rel="noopener noreferrer" />}
            >
              {developerWebsite}
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

export default SafeAppSocialLinksCard

const getSocialProfile = (socialProfiles: SafeAppSocialProfile[], platform: SafeAppSocialPlatforms) => {
  const socialLink = socialProfiles.find((socialProfile) => socialProfile.platform === platform)

  return socialLink
}
