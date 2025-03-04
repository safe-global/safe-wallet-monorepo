import Link from 'next/link'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import { default as MuiLink } from '@mui/material/Link'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import GitHubIcon from '@mui/icons-material/GitHub'
import TelegramIcon from '@mui/icons-material/Telegram'
import TwitterIcon from '@mui/icons-material/Twitter'
import { SafeAppSocialPlatforms } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeAppData, SafeAppSocialProfile } from '@safe-global/safe-gateway-typescript-sdk'

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
      <Box display="flex" alignItems="center" gap={1} component="a">
        {/* Team Link section */}
        <div className={css.questionMarkIcon}>
          <HelpOutlineRoundedIcon color="info" />
        </div>
        <div>
          <Typography fontWeight="bold" variant="subtitle1">
            Something wrong with the Safe App?
          </Typography>
          <Typography color="primary.light" variant="body2">
            Get in touch with the team
          </Typography>
        </div>
      </Box>

      <Box className={css.socialLinksSectionContainer} display="flex" gap={4}>
        {/* Social links section */}
        {hasSocialLinks && (
          <div>
            <Typography color="border.main" variant="body2" pl={1}>
              Social Media
            </Typography>

            <Box display="flex" mt={0.2} minHeight="40px">
              {discordSocialLink && (
                <IconButton
                  aria-label="Discord link"
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={discordSocialLink.url}
                >
                  <DiscordIcon />
                </IconButton>
              )}

              {twitterSocialLink && (
                <IconButton
                  aria-label="Twitter link"
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={twitterSocialLink.url}
                >
                  <TwitterIcon color="border" />
                </IconButton>
              )}

              {githubSocialLink && (
                <IconButton
                  aria-label="Github link"
                  component="a"
                  href={githubSocialLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ height: '40px', width: '40px' }}
                >
                  <GitHubIcon color="border" />
                </IconButton>
              )}

              {telegramSocialLink && (
                <IconButton
                  aria-label="Telegram link"
                  component="a"
                  href={telegramSocialLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ height: '40px', width: '40px' }}
                >
                  <TelegramIcon color="border" />
                </IconButton>
              )}
            </Box>
          </div>
        )}

        {hasSocialLinks && developerWebsite && (
          <Divider sx={{ height: '40px' }} orientation="vertical" component="div" />
        )}

        {/* Developer website section */}
        {developerWebsite && (
          <Box display="flex" flexDirection="column">
            <Typography color="border.main" variant="body2">
              Website
            </Typography>

            <Link
              href={developerWebsite}
              passHref
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              legacyBehavior
            >
              <MuiLink target="_blank" className={css.websiteLink} underline="hover" fontWeight="bold" mt={1.2}>
                {developerWebsite}
              </MuiLink>
            </Link>
          </Box>
        )}
      </Box>
    </Card>
  )
}

export default SafeAppSocialLinksCard

const getSocialProfile = (socialProfiles: SafeAppSocialProfile[], platform: SafeAppSocialPlatforms) => {
  const socialLink = socialProfiles.find((socialProfile) => socialProfile.platform === platform)

  return socialLink
}
